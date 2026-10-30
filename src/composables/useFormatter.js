import { ref, shallowRef, watch, computed } from 'vue'
import { render } from '../core/render.js'
import { createImageStore } from '../core/imageStore.js'
import { themes, getTheme, DEFAULT_THEME_ID } from '../core/themes.js'

const DRAFT_KEY = 'md-wechat-formatter:draft'
const THEME_KEY = 'md-wechat-formatter:theme'
const DEFAULT_FOOTER = '---\n\n—— 如果这篇对你有帮助 ——\n\n**点赞 · 转发**，是对我最大的支持'
const FOOTER_KEY = 'md-wechat-formatter:footer'
const FOOTER_ENABLED_KEY = 'md-wechat-formatter:footer-enabled'
const LINE_NUMBERS_KEY = 'md-wechat-formatter:line-numbers'

export function useFormatter() {
  const markdown = ref(localStorage.getItem(DRAFT_KEY) || '')
  const themeId = ref(localStorage.getItem(THEME_KEY) || DEFAULT_THEME_ID)
  const showLineNumbers = ref(localStorage.getItem(LINE_NUMBERS_KEY) !== 'false')
  const footer = ref(localStorage.getItem(FOOTER_KEY) ?? DEFAULT_FOOTER)
  const footerEnabled = ref(localStorage.getItem(FOOTER_ENABLED_KEY) !== 'false')
  const articleMarkdown = computed(() => {
    const body = markdown.value.trimEnd()
    const ending = footer.value.trim()
    if (!body.trim()) return ''
    if (!footerEnabled.value || !ending || body.endsWith(ending)) return body
    return `${body}\n\n${ending}`
  })
  const html = shallowRef('')
  const warnings = ref([])
  const imageCount = ref(0)
  const lastImagesInfo = ref('')

  const store = createImageStore()

  const stats = computed(() => {
    const text = markdown.value.replace(/[#>*`\-\[\]!|]/g, '')
    return { chars: text.replace(/\s/g, '').length }
  })

  let timer = null
  const doRender = () => {
    const env = {
      warnings: [],
      resolveImage: store.resolve,
      theme: getTheme(themeId.value),
      showLineNumbers: showLineNumbers.value,
    }
    try {
      html.value = articleMarkdown.value ? render(articleMarkdown.value, env) : ''
    } catch (e) {
      html.value = ''
      env.warnings.push('渲染出错：' + e.message)
    }
    warnings.value = env.warnings
  }

  watch(
    markdown,
    (v) => {
      localStorage.setItem(DRAFT_KEY, v)
      clearTimeout(timer)
      timer = setTimeout(doRender, 300)
    },
    { immediate: true }
  )

  watch([footer, footerEnabled], ([text, enabled]) => {
    localStorage.setItem(FOOTER_KEY, text)
    localStorage.setItem(FOOTER_ENABLED_KEY, String(enabled))
    clearTimeout(timer)
    timer = setTimeout(doRender, 300)
  }, { immediate: true })

  watch(themeId, (v) => {
    localStorage.setItem(THEME_KEY, v)
    clearTimeout(timer)
    doRender()
  })

  watch(showLineNumbers, (v) => {
    localStorage.setItem(LINE_NUMBERS_KEY, String(v))
    clearTimeout(timer)
    doRender()
  })

  const toggleLineNumbers = () => {
    showLineNumbers.value = !showLineNumbers.value
  }

  const refresh = () => {
    clearTimeout(timer)
    doRender()
  }

  const loadMarkdownFile = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        markdown.value = reader.result
        resolve(file.name)
      }
      reader.onerror = () => resolve(null)
      reader.readAsText(file, 'utf-8')
    })

  const addImages = async (files) => {
    const { added, dupes } = await store.addFiles(files)
    imageCount.value = store.count()
    lastImagesInfo.value = `已载入 ${added.length} 张${dupes.length ? `，${dupes.length} 张同名跳过` : ''}`
    refresh()
    return lastImagesInfo.value
  }

  const clear = () => {
    markdown.value = ''
    html.value = ''
    warnings.value = []
    localStorage.removeItem(DRAFT_KEY)
  }

  return { markdown, footer, footerEnabled, themeId, themes, showLineNumbers, toggleLineNumbers, html, warnings, imageCount, lastImagesInfo, stats, loadMarkdownFile, addImages, clear, refresh }
}
