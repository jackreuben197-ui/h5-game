#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

function normalizeApiPath(input) {
	if (!input) return ''
	const trimmed = String(input).trim()
	if (!trimmed) return ''
	if (trimmed.startsWith('/api/')) return trimmed
	if (trimmed === '/api') return '/api'
	if (trimmed.startsWith('/')) return `/api${trimmed}`
	return `/api/${trimmed}`
}

function toH5Endpoint(apiPath) {
	const normalized = normalizeApiPath(apiPath)
	if (!normalized.startsWith('/api/')) return normalized
	return normalized.slice('/api'.length)
}

function getApiGroup(apiPath) {
	const endpoint = toH5Endpoint(apiPath).replace(/^\//, '')
	return endpoint.split('/')[0] || ''
}

function protocolNameToSymbol(protocolName) {
	if (!protocolName) return ''
	return protocolName.replace(/^Http/, '').replace(/Protocol$/, '')
}

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
		api: normalizeApiPath(apiMatch[1]),
		protocolName: path.basename(filePath, '.cs'),
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
	return [...text.matchAll(/\/\/\s*((?:\/api)?\/[^\s(]+)\s*\(([^)]+)\)/g)].map((m) => ({
		api: normalizeApiPath(m[1].trim()),
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

	const arrayMatch = t.match(/^(.+)\[\]$/)
	if (arrayMatch) {
		return `${mapCsTypeToTs(arrayMatch[1], symbol, existingInterfaces)}[]`
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

function targetInterfaceName(symbol, className) {
	if (/^RequestData$/i.test(className) || /^Request$/i.test(className)) return `${symbol}Request`
	if (className === 'ResponseData') return `${symbol}ResponseData`
	if (className === 'Data') return `${symbol}Data`
	return `${symbol}${className}`
}

function collectDefinedProps(interfaceBody) {
	const out = new Set()
	const re = /\b([A-Za-z_]\w*)\??\s*:/g
	let m
	while ((m = re.exec(interfaceBody))) out.add(m[1])
	return out
}

function collectPropTypeMap(interfaceBody) {
	const out = new Map()
	const re = /^\s*([A-Za-z_]\w*)\??\s*:\s*([^;]+);/gm
	let m
	while ((m = re.exec(interfaceBody))) {
		out.set(m[1], m[2].trim())
	}
	return out
}

function isUnknownLikeType(tsType) {
	const t = (tsType || '').replace(/\s+/g, ' ').trim()
	return (
		t === 'unknown' ||
		t === 'unknown[]' ||
		t === 'Record<string, unknown>' ||
		t === 'any' ||
		t === 'any[]' ||
		t === 'object'
	)
}

function upgradePropType(body, propName, nextType) {
	const escaped = propName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	const re = new RegExp(`^(\\s*${escaped}\\??\\s*:\\s*)([^;]+)(;.*)$`, 'm')
	const match = body.match(re)
	if (!match) return body
	const currentType = (match[2] || '').trim()
	if (!isUnknownLikeType(currentType)) return body
	if (!nextType || nextType === 'unknown') return body
	return body.replace(re, `$1${nextType}$3`)
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

function patchInterface(text, iface, missingProps, commentCandidates, typeUpgrades) {
	if (!missingProps.length && !commentCandidates.length && !typeUpgrades.length) return text

	let newBody = iface.body
	for (const t of typeUpgrades) {
		newBody = upgradePropType(newBody, t.name, t.tsType)
	}
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

function ensureDir(filePath) {
	const dir = path.dirname(filePath)
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function ensureFile(filePath, content = '') {
	if (fs.existsSync(filePath)) return
	ensureDir(filePath)
	fs.writeFileSync(filePath, content)
}

function buildInterfaceBlock(name, props) {
	const lines = []
	lines.push(`export interface ${name} {`)
	for (const p of props) {
		const comment = sanitizeTsComment(p.comment || '')
		const propLine = `    ${p.name}?: ${p.tsType};`
		lines.push(comment ? `${propLine} // ${comment}` : propLine)
	}
	if (props.length) lines.push('')
	lines.push('  [key: string]: unknown')
	lines.push('}')
	return lines.join('\n')
}

function hasInterface(text, name) {
	return new RegExp(`export\\s+interface\\s+${name}(?:\\s+extends\\s+[^\\{]+)?\\s*\\{`).test(text)
}

function ensureModelEndpoint(modelText, apiPath, symbol, unity) {
	let text = modelText
	let ifaceMap = parseInterfaces(text)
	const apiLine = `// ${normalizeApiPath(apiPath)} (${symbol})`

	const plannedNames = new Set(ifaceMap.keys())
	for (const className of Object.keys(unity.classes)) {
		plannedNames.add(targetInterfaceName(symbol, className))
	}

	const requestName = targetInterfaceName(symbol, 'RequestData')
	const responseName = targetInterfaceName(symbol, 'ResponseData')
	const dataName = targetInterfaceName(symbol, 'Data')

	const requestProps = (unity.classes.RequestData || unity.classes.Request || []).map((p) => ({
		name: p.name,
		tsType: mapCsTypeToTs(p.type, symbol, plannedNames),
		comment: p.comment || '',
	}))

	const dataProps = (unity.classes.Data || []).map((p) => ({
		name: p.name,
		tsType: mapCsTypeToTs(p.type, symbol, plannedNames),
		comment: p.comment || '',
	}))

	const chunks = []
	if (!hasInterface(text, requestName)) {
		chunks.push(apiLine)
		chunks.push(buildInterfaceBlock(requestName, requestProps))
	}

	if (!hasInterface(text, responseName)) {
		if (!chunks.length) chunks.push(apiLine)
		chunks.push(`export interface ${responseName} extends ${dataName} {\n  [key: string]: unknown\n}`)
	}

	if (!hasInterface(text, dataName)) {
		if (!chunks.length) chunks.push(apiLine)
		chunks.push(buildInterfaceBlock(dataName, dataProps))
	}

	for (const [className, props] of Object.entries(unity.classes)) {
		if (/^RequestData$/i.test(className) || /^Request$/i.test(className) || className === 'ResponseData' || className === 'Data') {
			continue
		}
		const name = targetInterfaceName(symbol, className)
		if (hasInterface(text, name)) continue
		if (!chunks.length) chunks.push(apiLine)
		const typedProps = props.map((p) => ({
			name: p.name,
			tsType: mapCsTypeToTs(p.type, symbol, plannedNames),
			comment: p.comment || '',
		}))
		chunks.push(buildInterfaceBlock(name, typedProps))
	}

	if (!chunks.length) return text
	const appendix = `\n\n${chunks.join('\n\n')}\n`
	text = text.trimEnd() + appendix
	return text
}

function ensureNamedTypeImport(apiText, group, names) {
	let text = apiText
	const importRegex = new RegExp(`import type \\{([\\s\\S]*?)\\} from '@/api/models/${group}'`)
	const match = text.match(importRegex)
	if (match) {
		const block = match[1]
		const existing = new Set(
			block
				.split('\n')
				.map((line) => line.trim().replace(/,$/, ''))
				.filter(Boolean),
		)
		const toAdd = names.filter((n) => !existing.has(n))
		if (!toAdd.length) return text
		const insert = toAdd.map((n) => `  ${n},`).join('\n')
		const replaced = match[0].replace(/\n\}\s*from/, `\n${insert}\n} from`)
		return text.replace(match[0], replaced)
	}

	const commonImportRegex = /import\s+type\s+\{\s*ApiResponse\s*\}\s+from\s+'@\/api\/models\/common'\s*/
	const commonMatch = text.match(commonImportRegex)
	if (commonMatch) {
		const importBlock = `import type {\n${names.map((n) => `  ${n},`).join('\n')}\n} from '@/api/models/${group}'\n`
		return text.replace(commonImportRegex, `${commonMatch[0]}\n${importBlock}`)
	}

	return `import type {\n${names.map((n) => `  ${n},`).join('\n')}\n} from '@/api/models/${group}'\n${text}`
}

function ensureFormatPathHelper(apiText) {
	if (apiText.includes('const formatPath = (')) return apiText
	const helper = "const formatPath = (\n  template: string,\n  pathParams: Record<string, string | number>,\n): string => template.replace(/\\{([^}]+)\\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? '')))\nvoid formatPath\n\n"
	const marker = "import type { ApiResponse } from '@/api/models/common'"
	const idx = apiText.indexOf(marker)
	if (idx >= 0) {
		const tailIdx = apiText.indexOf('\n', idx)
		return apiText.slice(0, tailIdx + 1) + '\n' + helper + apiText.slice(tailIdx + 1)
	}
	return `${helper}${apiText}`
}

function ensureApiFunction(apiText, symbol, apiPath) {
	let text = apiText
	const fnName = `post${symbol}Api`
	if (new RegExp(`export\\s+async\\s+function\\s+${fnName}\\s*\\(`).test(text)) return text

	const endpoint = toH5Endpoint(apiPath)
	const requestName = `${symbol}Request`
	const responseName = `${symbol}ResponseData`
	const hasPathParam = /\{[^}]+\}/.test(endpoint)

	if (hasPathParam) {
		text = ensureFormatPathHelper(text)
	}

	const fn = hasPathParam
		? `\n// 对齐 cocos Web${symbol}.API\nexport async function ${fnName}(\n  payload: ${requestName} = {} as ${requestName},\n  pathParams: Record<string, string | number> = {},\n): Promise<ApiResponse<${responseName}>> {\n  const endpoint = formatPath('${endpoint}', pathParams)\n  const response = await http.post<ApiResponse<${responseName}>>(endpoint, payload)\n  return response.data\n}\n`
		: `\n// 对齐 cocos Web${symbol}.API\nexport async function ${fnName}(\n  payload: ${requestName} = {} as ${requestName}\n): Promise<ApiResponse<${responseName}>> {\n  const response = await http.post<ApiResponse<${responseName}>>('${endpoint}', payload)\n  return response.data\n}\n`

	return text.trimEnd() + '\n' + fn
}

function ensureEndpointWhenMissing(args, unityByApi, requestedApi) {
	const normalizedApi = normalizeApiPath(requestedApi)
	if (!normalizedApi) return { created: false, touched: [] }
	const unityVariants = unityByApi.get(normalizedApi)
	if (!unityVariants?.length) return { created: false, touched: [] }

	const group = getApiGroup(normalizedApi)
	if (!group) return { created: false, touched: [] }

	const modelFile = path.join(args.modelsRoot, `${group}.ts`)
	const apiFile = path.resolve(process.cwd(), 'src/api', `${group}.ts`)
	const unity = unityVariants.find((u) => u.classes.ResponseData || u.classes.Data || u.classes.RequestData) || unityVariants[0]
	const symbol = protocolNameToSymbol(unity.protocolName)
	if (!symbol) return { created: false, touched: [] }

	ensureFile(modelFile, '')
	ensureFile(apiFile, "import http from '@/api/http'\nimport type { ApiResponse } from '@/api/models/common'\n")

	let modelText = fs.readFileSync(modelFile, 'utf8')
	const existedMeta = parseModelMeta(modelText).some((m) => m.api === normalizedApi)
	if (existedMeta) {
		return { created: false, touched: [] }
	}
	const beforeModel = modelText
	modelText = ensureModelEndpoint(modelText, normalizedApi, symbol, unity)

	let apiText = fs.readFileSync(apiFile, 'utf8')
	const beforeApi = apiText
	apiText = ensureNamedTypeImport(apiText, group, [`${symbol}Request`, `${symbol}ResponseData`])
	apiText = ensureApiFunction(apiText, symbol, normalizedApi)

	const touched = []
	if (modelText !== beforeModel) {
		touched.push(modelFile)
		if (!args.dryRun) fs.writeFileSync(modelFile, modelText)
	}
	if (apiText !== beforeApi) {
		touched.push(apiFile)
		if (!args.dryRun) fs.writeFileSync(apiFile, apiText)
	}

	return { created: touched.length > 0, touched }
}

function main() {
	const args = parseArgs(process.argv.slice(2))
	const apiFilter = normalizeApiPath(args.api.trim())

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

	const bootstrap = apiFilter ? ensureEndpointWhenMissing(args, unityByApi, apiFilter) : { created: false, touched: [] }
	for (const touchedFile of bootstrap.touched) {
		console.log(`patched ${path.relative(process.cwd(), touchedFile)}`)
	}

	const modelFiles = fs
		.readdirSync(args.modelsRoot)
		.filter((f) => f.endsWith('.ts'))
		.map((f) => path.join(args.modelsRoot, f))

	let touched = bootstrap.touched.filter((p) => p.endsWith('.ts')).length
	let totalPatchedProps = 0

	for (const modelFile of modelFiles) {
		let text = fs.readFileSync(modelFile, 'utf8')
		const metas = parseModelMeta(text)
		if (!metas.length) continue

		let fileChanged = false

		for (const meta of metas) {
			if (apiFilter && normalizeApiPath(meta.api) !== apiFilter) continue
			const unityVariants = unityByApi.get(meta.api)
			if (!unityVariants?.length) continue

			const unity = unityVariants.find((u) => u.classes.ResponseData || u.classes.Data) || unityVariants[0]
			const ensuredText = ensureModelEndpoint(text, meta.api, meta.symbol, unity)
			if (ensuredText !== text) {
				text = ensuredText
				fileChanged = true
			}
			let ifaceMap = parseInterfaces(text)
			const knownNames = new Set(ifaceMap.keys())
			for (const className of Object.keys(unity.classes)) {
				knownNames.add(targetInterfaceName(meta.symbol, className))
			}

			for (const [className, props] of Object.entries(unity.classes)) {
				if (!props.length) continue

				const targetName = targetInterfaceName(meta.symbol, className)
				const iface = ifaceMap.get(targetName)
				if (!iface) continue // Only process interfaces already present in h5 models

				const defined = collectDefinedProps(iface.body)
				const propTypeMap = collectPropTypeMap(iface.body)
				const missing = []
				const commentCandidates = []
				const typeUpgrades = []
				for (const p of props) {
					if (className === 'ResponseData' && p.name === 'data') continue
					const tsType = mapCsTypeToTs(p.type, meta.symbol, knownNames)
					if (defined.has(p.name)) {
						const currentType = propTypeMap.get(p.name)
						if (currentType && isUnknownLikeType(currentType) && tsType !== 'unknown') {
							typeUpgrades.push({ name: p.name, tsType })
						}
						if (p.comment) {
							commentCandidates.push({ name: p.name, comment: p.comment })
						}
						continue
					}
					missing.push({ name: p.name, tsType, comment: p.comment || '' })
				}

				if (!missing.length && !commentCandidates.length && !typeUpgrades.length) continue
				const patchedText = patchInterface(text, iface, missing, commentCandidates, typeUpgrades)
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
