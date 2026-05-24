import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      increaseIndent: () => ReturnType
      decreaseIndent: () => ReturnType
    }
  }
}

export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'], 
      indentSize: 2,
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const padding = element.style.marginLeft
              if (!padding) return 0
              return parseInt(padding, 10) / this.options.indentSize
            },
            renderHTML: attributes => {
              if (!attributes.indent || attributes.indent === 0) return {}
              return { style: `margin-left: ${attributes.indent * this.options.indentSize}rem` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      increaseIndent: () => ({ tr, state, dispatch }) => {
        const { selection } = state
        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              indent: currentIndent + 1,
            })
          }
        })
        if (dispatch) dispatch(tr)
        return true
      },
      decreaseIndent: () => ({ tr, state, dispatch }) => {
        const { selection } = state
        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0
            if (currentIndent > 0) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: currentIndent - 1,
              })
            }
          }
        })
        if (dispatch) dispatch(tr)
        return true
      },
    }
  },
})