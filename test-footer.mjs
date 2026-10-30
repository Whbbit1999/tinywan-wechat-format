import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { nextTick } from 'vue'

const dom = new JSDOM('', { url: 'https://example.com' })
globalThis.DOMParser = dom.window.DOMParser
globalThis.Node = dom.window.Node
globalThis.localStorage = dom.window.localStorage
const { useFormatter } = await import('./src/composables/useFormatter.js')
const settle = async () => {
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 350))
}
const formatter = useFormatter()
assert.equal(formatter.footer.value, '---\n\n—— 如果这篇对你有帮助 ——\n\n**点赞 · 转发**，是对我最大的支持')
localStorage.setItem('md-wechat-formatter:footer', '')
assert.equal(useFormatter().footer.value, '')
localStorage.setItem('md-wechat-formatter:footer', formatter.footer.value)
formatter.markdown.value = '第一篇正文'
formatter.footer.value = '---\n\n—— 如果这篇对你有帮助 ——\n\n**点赞 · 转发**，是对我最大的支持'
await settle()
assert.ok(formatter.html.value.includes('第一篇正文'))
assert.ok(formatter.html.value.includes('是对我最大的支持'))
assert.equal(formatter.markdown.value, '第一篇正文')
assert.equal(localStorage.getItem('md-wechat-formatter:footer'), formatter.footer.value)
formatter.markdown.value = '替换后的正文'
await settle()
assert.ok(formatter.html.value.includes('是对我最大的支持'))
assert.ok(!formatter.html.value.includes('第一篇正文'))
formatter.markdown.value += '\n\n' + formatter.footer.value
await settle()
assert.equal(formatter.html.value.split('是对我最大的支持').length - 1, 1)
formatter.markdown.value = '正文'
formatter.footerEnabled.value = false
await settle()
assert.ok(!formatter.html.value.includes('是对我最大的支持'))
const restored = useFormatter()
assert.equal(restored.footer.value, formatter.footer.value)
assert.equal(restored.footerEnabled.value, false)
formatter.footerEnabled.value = true
formatter.clear()
await settle()
assert.equal(formatter.html.value, '')
assert.ok(formatter.footer.value.includes('是对我最大的支持'))
formatter.markdown.value = '新文章'
await settle()
assert.ok(formatter.html.value.includes('是对我最大的支持'))
formatter.footer.value = '  '
await settle()
assert.ok(!formatter.html.value.includes('是对我最大的支持'))
console.log('公共文案：持久化、替换正文、避免重复、停用、恢复、清空和空文案检查通过')
