"use client";

import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { Tldraw, type Editor } from "tldraw";
import "tldraw/tldraw.css";

export type WhiteboardHandle = {
  captureScreenshot: () => Promise<string | null>;
};

export const WhiteboardPanel = forwardRef<WhiteboardHandle>(
  function WhiteboardPanel(_props, ref) {
    const editorRef = useRef<Editor | null>(null);

    const handleMount = useCallback((editor: Editor) => {
      editorRef.current = editor;
    }, []);

    useImperativeHandle(ref, () => ({
      async captureScreenshot() {
        const editor = editorRef.current;
        if (!editor) return null;

        const shapeIds = editor.getCurrentPageShapeIds();
        if (shapeIds.size === 0) return null;

        try {
          const result = await editor.toImageDataUrl([...shapeIds], {
            format: "png",
            quality: 0.8,
            background: true,
            padding: 16,
          });
          return result.url;
        } catch {
          return null;
        }
      },
    }));

    return (
      <div className="flex h-full min-h-112 flex-col">
        <div className="min-h-0 flex-1 overflow-hidden rounded-none border border-base-300">
          <Tldraw onMount={handleMount} />
        </div>
      </div>
    );
  },
);
