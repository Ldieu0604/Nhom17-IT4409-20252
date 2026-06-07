"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { 
    KEY_TAB_COMMAND, 
    INDENT_CONTENT_COMMAND, 
    OUTDENT_CONTENT_COMMAND, 
    COMMAND_PRIORITY_LOW 
} from "lexical";

export default function EditorTabPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            KEY_TAB_COMMAND,
            (event) => {
                const isShift = event.shiftKey;
                event.preventDefault(); 

                if (isShift) {
                    editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
                } else {
                    editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
                }
                return true;
            },
            COMMAND_PRIORITY_LOW
        );
    }, [editor]);

    return null;
}