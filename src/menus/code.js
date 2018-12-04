import { JQ as $ } from 'mdui';
import { replaceHtmlSymbol } from '../helper/utils';

/**
 * 代码块
 */
class Code {
  constructor(editor) {
    this.editor = editor;
    this.icon = 'code';
    this.title = '代码块';
    this.disable = ['bold', 'italic', 'head', 'ol', 'ul', 'link', 'image'];
    this._active = false;
    this._init();
  }

  _init() {
    const { editor } = this;
    const { selection, cmd, $content } = editor;

    $content.on('keydown', (event) => {
      if (event.keyCode === 13) {
        // 按回车时，添加 \n
        if (this._active) {
          event.preventDefault();

          const _startOffset = selection.getRange().startOffset;

          cmd.do('insertHTML', '\n');
          selection.saveRange();
          if (selection.getRange().startOffset === _startOffset) {
            // 没起作用，再来一次
            cmd.do('insertHTML', '\n');
          }

          // 换行后滚动条回到最左侧
          selection.getContainerElem()[0].scrollLeft = 0;
        }
      }

      if (event.keyCode === 9) {
        // 按 tab 时，添加四个空格
        if (this._active) {
          event.preventDefault();
          cmd.do('insertHTML', '    ');
        }
      }
    });
  }

  onclick() {
    const { editor } = this;
    const { selection, cmd, $content } = editor;
    const $rootElem = selection.getRootElem();

    if (this._active) {
      // 若当前是代码块，则每一行都转换为 p 标签
      const textArray = $rootElem.text().split('\n');
      let html = '';

      textArray.forEach((line) => {
        line = replaceHtmlSymbol(line);
        html = line ? `<p>${line}</p>${html}` : `<p><br></p>${html}`;
      });

      cmd.do('replaceRoot', html);

      return;
    }

    if (!$rootElem.length) {
      const range = selection.getRange();

      if (range.collapsed) {
        // 没有选中任何选区，在最后添加一行
        cmd.do('appendHTML', '<pre><br></pre>');
      } else {
        // 选中了多行，把多行包裹在同一个 pre 中
        let text = '';
        let isInRange = false;
        let $linesRemove = $();

        $content.children().each((i, line) => {
          const $line = $(line);

          if (!isInRange) {
            if (
              $line.is(range.startContainer)
              || $line[0].contains(range.startContainer)
              || $content.is(range.startContainer)
            ) {
              isInRange = true;
            }
          }

          if (isInRange) {
            text += `${replaceHtmlSymbol($line.text())}\n`;
            $linesRemove = $linesRemove.add($line);

            if ($line.is(range.endContainer) || $line[0].contains(range.endContainer)) {
              return false;
            }
          }

          return true;
        });


        $linesRemove.each((i, line) => {
          const $line = $(line);
          if (i < $linesRemove.length - 1) {
            $line.remove();
          }
        });

        selection.createRangeByElem($linesRemove.last(), false, true);
        cmd.do('replaceRoot', `<pre>${text}</pre>`);
      }

      return;
    }

    // 选中单行，需要移除选区内容所有子元素的标签，然后转换为 pre
    const text = replaceHtmlSymbol($rootElem.text());
    cmd.do('replaceRoot', text ? `<pre>${text}</pre>` : '<pre><br></pre>');
  }

  isActive() {
    this._active = this.editor.selection.getRootElem().is('pre');

    return this._active;
  }
}

export default Code;
