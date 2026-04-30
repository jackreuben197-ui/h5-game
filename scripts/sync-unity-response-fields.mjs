#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

function parseArgs(argv) {
	const args = {
		api: '',
		unityRoot:
			'/Users/kongfanbing/data/unity-new-poker/Hotfix/CrazyPoker/Module/Message/CPHotfixWebMessage',
		modelsRoot: path.resolve(process.cwd(), 'src/api/models'),
		dryRun: false,
	}

	for (const raw of argv) {
		if (raw.startsWith('--api=')) args.api = raw.slice('--api='.length)
		else if (raw.startsWith('--unityRoot=')) args.unityRoot = raw.slice('--unityRoot='.length)
		else if (raw.startsWith('--modelsRoot=')) args.modelsRoot = raw.slice('--modelsRoot='.length)
		else if (raw === '--dry-run') args.dryRun = true
	}

	return args
}

function walk(dir, ext = '.cs') {
	const out = []
	const entries = fs.readdirSync(dir, { withFileTypes: true })
	for (const ent of entries) {
		const full = path.join(dir, ent.name)
		if (ent.isDirectory()) out.push(...walk(full, ext))
		else if (ent.isFile() && ent.name.endsWith(ext)) out.push(full)
	}
	return out
}

function parseUnityFile(filePath) {
	const text = fs.readFileSync(filePath, 'utf8')
	const apiMatch = text.match(/const\s+string\s+API\s*=\s*@"([^"]+)"\s*;/)
	if (!apiMatch) return null

	const classes = {}
	const classRegex = /public\s+sealed\s+class\s+(\w+)(?:\s*:\s*[^{\n]+)?\s*\{([\s\S]*?)\n\s*\}/g
	let cm
	while ((cm = classRegex.exec(text))) {
		const className = cm[1]
		const body = cm[2]
		const props = []
		const propRegex = /((?:\s*\/\/\/[^\n]*\n)*)\s*public\s+(.+?)\s+(\w+)\s*\{\s*get;\s*set;\s*\}/g
		let pm
		while ((pm = propRegex.exec(body))) {
			props.push({ type: pm[2].trim(), name: pm[3].trim(), comment: parseCSharpDoc(pm[1] || '') })
		}
		classes[className] = props
	}

	return {
		filePath,
		api: apiMatch[1],
		classes,
	}
}

function parseCSharpDoc(docBlock) {
	if (!docBlock) return ''
	const lines = docBlock
		.split('\n')
		.map((line) => line.trim())
		.map((line) => line.replace(/^\/\/\/\s?/, '').trim())
		.filter((line) => line.length > 0)
		.map((line) => line.replace(/^<summary>\s*$/, '').replace(/^<\/summary>\s*$/, '').trim())
		.filter((line) => line.length > 0)

	return lines.join(' ').replace(/\s+/g, ' ').trim()
}

function sanitizeTsComment(comment) {
	if (!comment) return ''
	return comment.replace(/\*\//g, '* /').replace(/\s+/g, ' ').trim()
}

function parseModelMeta(text) {
	return [...text.matchAll(/\/\/\s*(\/api\/[^\s(]+)\s*\(([^)]+)\)/g)].map((m) => ({
		api: m[1].trim(),
		symbol: m[2].trim(),
	}))
}

function parseInterfaces(text) {
	const map = new Map()
	const re = /export\s+interface\s+(\w+)\s*\{([\s\S]*?)\n\}/g
	let m
	while ((m = re.exec(text))) {
		map.set(m[1], {
			name: m[1],
			body: m[2],
			full: m[0],
			index: m.index,
			end: m.index + m[0].length,
		})
	}
	return map
}

function normalizeType(raw) {
	return raw
		.replace(/\s+/g, ' ')
		.replace(/global::/g, '')
		.trim()
}

function splitGenericArgs(typeText) {
	const args = []
	let cur = ''
	let depth = 0
	for (const ch of typeText) {
		if (ch === '<') depth += 1
		if (ch === '>') depth -= 1
		if (ch === ',' && depth === 0) {
			args.push(cur.trim())
			cur = ''
			continue
		}
		cur += ch
	}
	if (cur.trim()) args.push(cur.trim())
	return args
}

function isPrimitive(typeName) {
	return new Set([
		'int',
		'long',
		'short',
		'ushort',
		'uint',
		'ulong',
		'byte',
		'sbyte',
		'float',
		'double',
		'decimal',
		'bool',
		'boolean',
		'string',
		'object',
		'DateTime',
	]).has(typeName)
}

function mapCsTypeToTs(typeName, symbol, existingInterfaces) {
	let t = normalizeType(typeName)
	let nullable = false

	if (t.endsWith('?')) {
		nullable = true
		t = t.slice(0, -1).trim()
	}

	const listMatch = t.match(/^(?:List|IList|IEnumerable|RepeatedField)<(.+)>$/)
	if (listMatch) {
		return `${mapCsTypeToTs(listMatch[1], symbol, existingInterfaces)}[]`
	}

	const dictMatch = t.match(/^Dictionary<(.+)>$/)
	if (dictMatch) {
		const [k, v] = splitGenericArgs(dictMatch[1])
		const keyType = /string/i.test(k) ? 'string' : 'string'
		return `Record<${keyType}, ${mapCsTypeToTs(v, symbol, existingInterfaces)}>`
	}

	if (t === 'string') return nullable ? 'string | null' : 'string'
	if (t === 'bool' || t === 'boolean') return nullable ? 'boolean | null' : 'boolean'
	if (
		['int', 'long', 'short', 'ushort', 'uint', 'ulong', 'byte', 'sbyte', 'float', 'double', 'decimal'].includes(
			t,
		)
	) {
		return nullable ? 'number | null' : 'number'
	}
	if (t === 'DateTime') return nullable ? 'string | null' : 'string'
	if (t === 'object') return 'unknown'

	// Handle namespaced class refs like SomeProtocol.Data / Namespace.Type
	const base = t.split('.').at(-1) || t
	if (isPrimitive(base)) return mapCsTypeToTs(base, symbol, existingInterfaces)

	const candidate = base === 'ResponseData' ? `${symbol}ResponseData` : `${symbol}${base}`
	if (existingInterfaces.has(candidate)) return candidate

	// Fallback to base type if it's already a known interface
	if (existingInterfaces.has(base)) return base

	return 'unknown'
}

function collectDefinedProps(interfaceBody) {
	const out = new Set()
	const re = /\b([A-Za-z_]\w*)\??\s*:/g
	let m
	while ((m = re.exec(interfaceBody))) out.add(m[1])
	return out
}

function addInlinePropComment(body, propName, comment) {
	if (!comment) return body
	const safeComment = sanitizeTsComment(comment)
	if (!safeComment) return body

	const escaped = propName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	const withCommentPattern = new RegExp(`^\\s*${escaped}\\??\\s*:\\s*[^;]+;\\s*//`, 'm')
	if (withCommentPattern.test(body)) return body

	const propPattern = new RegExp(`^(\\s*${escaped}\\??\\s*:\\s*[^;]+;)(\\s*)$`, 'm')
	if (!propPattern.test(body)) return body

	return body.replace(propPattern, `$1 // ${safeComment}$2`)
}

function patchInterface(text, iface, missingProps, commentCandidates) {
	if (!missingProps.length && !commentCandidates.length) return text

	let newBody = iface.body
	for (const c of commentCandidates) {
		newBody = addInlinePropComment(newBody, c.name, c.comment)
	}

	const insert = missingProps
		.map((p) => {
			const propLine = `    ${p.name}?: ${p.tsType};`
			const comment = sanitizeTsComment(p.comment || '')
			return comment ? `${propLine} // ${comment}` : propLine
		})
		.join('\n')

	if (insert) {
		if (newBody.includes('[key: string]: unknown')) {
			newBody = newBody.replace(/\n\s*\[key:\s*string\]:\s*unknown\s*/, `\n${insert}\n\n  [key: string]: unknown`)
		} else {
			newBody = `${newBody}\n${insert}\n`
		}
	}

	const newFull = `export interface ${iface.name} {${newBody}\n}`
	return text.slice(0, iface.index) + newFull + text.slice(iface.end)
}

function main() {
	const args = parseArgs(process.argv.slice(2))
	const apiFilter = args.api.trim()

	if (!fs.existsSync(args.unityRoot)) {
		throw new Error(`Unity path not found: ${args.unityRoot}`)
	}
	if (!fs.existsSync(args.modelsRoot)) {
		throw new Error(`Models path not found: ${args.modelsRoot}`)
	}

	const unityFiles = walk(args.unityRoot, '.cs')
	const unityByApi = new Map()
	for (const file of unityFiles) {
		const parsed = parseUnityFile(file)
		if (!parsed) continue
		if (!unityByApi.has(parsed.api)) unityByApi.set(parsed.api, [])
		unityByApi.get(parsed.api).push(parsed)
	}

	const modelFiles = fs
		.readdirSync(args.modelsRoot)
		.filter((f) => f.endsWith('.ts'))
		.map((f) => path.join(args.modelsRoot, f))

	let touched = 0
	let totalPatchedProps = 0

	for (const modelFile of modelFiles) {
		let text = fs.readFileSync(modelFile, 'utf8')
		const metas = parseModelMeta(text)
		if (!metas.length) continue

		let fileChanged = false

		for (const meta of metas) {
			if (apiFilter && meta.api !== apiFilter) continue
			const unityVariants = unityByApi.get(meta.api)
			if (!unityVariants?.length) continue

			const unity = unityVariants.find((u) => u.classes.ResponseData || u.classes.Data) || unityVariants[0]
			let ifaceMap = parseInterfaces(text)

			for (const [className, props] of Object.entries(unity.classes)) {
				if (!props.length) continue

				let targetName = ''
				if (/^RequestData$/i.test(className) || /^Request$/i.test(className)) {
					targetName = `${meta.symbol}Request`
				} else if (className === 'ResponseData') {
					targetName = `${meta.symbol}ResponseData`
				} else {
					targetName = `${meta.symbol}${className}`
				}
				const iface = ifaceMap.get(targetName)
				if (!iface) continue // Only process interfaces already present in h5 models

				const defined = collectDefinedProps(iface.body)
				const missing = []
				const commentCandidates = []
				for (const p of props) {
					if (className === 'ResponseData' && p.name === 'data') continue
					if (defined.has(p.name)) {
						if (p.comment) {
							commentCandidates.push({ name: p.name, comment: p.comment })
						}
						continue
					}
					const tsType = mapCsTypeToTs(p.type, meta.symbol, ifaceMap)
					missing.push({ name: p.name, tsType, comment: p.comment || '' })
				}

				if (!missing.length && !commentCandidates.length) continue
				const patchedText = patchInterface(text, iface, missing, commentCandidates)
				if (patchedText === text) continue
				text = patchedText
				ifaceMap = parseInterfaces(text)
				fileChanged = true
				totalPatchedProps += missing.length
			}
		}

		if (fileChanged) {
			touched += 1
			if (!args.dryRun) fs.writeFileSync(modelFile, text)
			console.log(`patched ${path.relative(process.cwd(), modelFile)}`)
		}
	}

	console.log(`done. touched_files=${touched}, patched_props=${totalPatchedProps}, api_filter=${apiFilter || 'ALL'}`)
}

try {
	main()
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error))
	process.exit(1)
}
