<template>
  <div class="app">
    <Toolbar
      :image-count="imageCount"
      :status-text="statusText"
      :has-html="!!html"
      :theme-id="themeId"
      :themes="themes"
      :mode="previewMode"
      :show-line-numbers="showLineNumbers"
      @open-md="editor.openMd()"
      @pick-images="editor.pickImages()"
      @load-sample="loadSample"
      @format-text="formatText"
      @theme-change="onThemeChange"
      @mode-change="onModeChange"
      @toggle-line-numbers="toggleLineNumbers"
      @copy-rich="copyRich"
      @copy-html="copyHtmlSource"
      @export="exportHtml"
      @clear="clear"
    />
    <div class="panes">
      <div class="editor-column">
        <EditorPane
          ref="editor"
          v-model="markdown"
          @md-file="onMdFile"
          @image-files="onImageFiles"
        />
        <details class="footer-settings">
          <summary>公共文案{{ footer.trim() ? (footerEnabled ? ' · 已启用' : ' · 已停用') : ' · 未设置' }}</summary>
          <div class="footer-settings-body">
            <label class="footer-toggle">
              <input v-model="footerEnabled" type="checkbox">
              自动附加到文章末尾
            </label>
            <label for="article-footer">文末文案（支持 Markdown）</label>
            <textarea
              id="article-footer"
              v-model="footer"
              rows="5"
              placeholder="---&#10;&#10;—— 如果这篇对你有帮助 ——&#10;&#10;**点赞 · 转发**，是对我最大的支持"
              spellcheck="false"
            ></textarea>
            <p>自动保存在当前浏览器。替换或清空正文不影响文案；取消勾选可暂时停用。</p>
          </div>
        </details>
      </div>
      <PreviewPane ref="preview" :html="html" :warnings="warnings" :mode="previewMode" />
    </div>
    <ToastTip ref="toast" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Toolbar from './components/Toolbar.vue'
import EditorPane from './components/EditorPane.vue'
import PreviewPane from './components/PreviewPane.vue'
import ToastTip from './components/ToastTip.vue'
import { useFormatter } from './composables/useFormatter.js'
import { copyRichText, copyText, downloadHtml } from './composables/useClipboard.js'
import sampleMd from './assets/sample.md?raw'
import { spacingMarkdown } from './core/pangu.js'

const editor = ref(null)
const preview = ref(null)
const toast = ref(null)

const { markdown, footer, footerEnabled, themeId, themes, showLineNumbers, toggleLineNumbers, html, warnings, imageCount, lastImagesInfo, stats, loadMarkdownFile, addImages, clear: clearAll } = useFormatter()

const statusText = computed(() => `${stats.value.chars} 字 · ${imageCount.value} 张图片`)

const loadSample = () => {
  markdown.value = sampleMd
  toast.value.show('已载入示例文章')
}

const formatText = () => {
  const before = markdown.value
  const after = spacingMarkdown(before)
  if (after === before) {
    toast.value.show('文本已符合规范，无需调整')
  } else {
    markdown.value = after
    toast.value.show('已自动在中英文之间加空格')
  }
}

const onThemeChange = (id) => {
  themeId.value = id
  const name = themes.find((t) => t.id === id)?.name || id
  toast.value.show(`已切换主题：${name}`)
}

const previewMode = ref('pc')
const onModeChange = (m) => {
  previewMode.value = m
}

const onMdFile = async (file) => {
  const name = await loadMarkdownFile(file)
  toast.value.show(name ? `已打开 ${name}` : '文件读取失败', name ? 'ok' : 'warn')
}

const onImageFiles = async (files) => {
  const info = await addImages(files)
  toast.value.show(info)
}

const copyRich = async () => {
  const el = preview.value.contentEl
  if (!el) return
  const res = await copyRichText(el)
  if (res.ok) toast.value.show(res.fallback ? '已复制（兼容模式）' : '已复制富文本，直接粘贴进公众号编辑器')
  else toast.value.show('复制失败，请改用「复制 HTML」', 'warn')
}

const copyHtmlSource = async () => {
  const ok = await copyText(html.value)
  toast.value.show(ok ? '已复制 HTML 源码' : '复制失败', ok ? 'ok' : 'warn')
}

const exportHtml = () => {
  downloadHtml(html.value, 'article.html')
  toast.value.show('已导出 article.html')
}

const clear = () => {
  clearAll()
  toast.value.show('已清空')
}
</script>
