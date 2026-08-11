import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import vueParser from 'vue-eslint-parser'
import vuePlugin from 'eslint-plugin-vue'

const localPlugin = {
  rules: {
    // 强制相邻兄弟标签至少有一个换行（例如 </span><span> -> </span>\n<span>）。
    'sibling-tag-newline': {
      meta: {
        type: 'layout',
        fixable: 'whitespace',
        schema: [],
        messages: {
          expectedNewline: 'Expected a line break between sibling tags.',
        },
      },
      create(context) {
        const sourceCode = context.sourceCode
        const parserServices = sourceCode.parserServices
        if (!parserServices?.defineTemplateBodyVisitor) {
          return {}
        }

        return parserServices.defineTemplateBodyVisitor({
          VElement(node) {
            const children = (node.children || []).filter(
              (child) => child && child.type === 'VElement' && Array.isArray(child.range),
            )

            for (let index = 0; index < children.length - 1; index += 1) {
              const prev = children[index]
              const next = children[index + 1]
              if (!prev?.range || !next?.range) {
                continue
              }

              const betweenRange = [prev.range[1], next.range[0]]
              const betweenText = sourceCode.text.slice(betweenRange[0], betweenRange[1])

              if (betweenText.includes('\n')) {
                continue
              }

              context.report({
                node: next,
                messageId: 'expectedNewline',
                fix(fixer) {
                  return fixer.replaceTextRange(betweenRange, '\n')
                },
              })
            }
          },
        })
      },
    },
  },
}

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'agreement-web/**',
      'components.d.ts',
      'src/bridge/ws/pb/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['scripts/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
  ...vuePlugin.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      vue: vuePlugin,
      local: localPlugin,
    },
    rules: {
      // ── 排版交给 Prettier ──────────────────────────────────────────────────
      // 下面这些规则要么和 Prettier 100% 重叠（quotes/semi/space-* 等），
      // 要么对嵌套三元这类边界 case 的缩进认知和 Prettier 不一致
      // （indent + offsetTernaryExpressions），保存时会出现
      // "Prettier 排成 A → ESLint --fix 改成 B → 下一次保存又被 Prettier 拉回 A"
      // 的拉锯。统一关掉，Prettier 一家说了算。
      quotes: 'off',
      semi: 'off',
      'no-extra-semi': 'off',
      'semi-spacing': 'off',
      indent: 'off',
      'key-spacing': 'off',
      'space-infix-ops': 'off',
      'comma-spacing': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      'arrow-spacing': 'off',
      'keyword-spacing': 'off',
      'space-before-function-paren': 'off',
      'space-in-parens': 'off',
      'no-multi-spaces': 'off',
      'no-trailing-spaces': 'off',
      'no-multiple-empty-lines': 'off',
      // 允许 <span>文字</span> 单行写法，与 Prettier 风格一致。
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': [
        'error',
        {
          allowEmptyLines: false,
          ignores: ['pre', 'textarea'],
        },
      ],
      // .vue 文件交给 Prettier 负责模板缩进，避免与 vue/html-indent 反复冲突。
      'vue/html-indent': 'off',
      // 与 Prettier singleAttributePerLine:false 保持一致，不强制每个属性独占一行。
      'vue/max-attributes-per-line': [
        'error',
        {
          singleline: {
            max: 999,
          },
          multiline: {
            max: 1,
          },
        },
      ],
      'vue/html-closing-bracket-newline': [
        'error',
        {
          singleline: 'never',
          multiline: 'always',
        },
      ],
      // void 元素（img/input 等）允许自闭合 <img />，非 void 元素不允许。
      'vue/html-self-closing': [
        'warn',
        {
          html: {
            void: 'always',
            normal: 'never',
            component: 'always',
          },
          svg: 'always',
          math: 'always',
        },
      ],
      'local/sibling-tag-newline': 'error',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
]
