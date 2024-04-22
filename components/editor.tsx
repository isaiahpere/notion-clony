"use client";

import { HTMLAttributes } from "react";
import { useTheme } from "next-themes";

import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import {
  BlockNoteView,
  useCreateBlockNote,
  SideMenu,
  SideMenuController,
} from "@blocknote/react";
import "@blocknote/react/style.css";
import { useEdgeStore } from "@/lib/edgestore";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

export type BlockNoteViewProps = {
  editor: BlockNoteEditor;
  editable?: boolean;
  onSelectionChange?: () => void;
  onChange?: (content: string) => void;
  formattingToolbar?: boolean;
  linkToolbar?: boolean;
  sideMenu?: boolean;
  slashMenu?: boolean;
  imageToolbar?: boolean;
  tableHandles?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export const Editor = ({ onChange, initialContent, editable }: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const { edgestore } = useEdgeStore();

  const handleUpload = async (file: File) => {
    const response = await edgestore.publicFiles.upload({ file });
    return response.url;
  };

  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialContent
      ? (JSON.parse(initialContent) as PartialBlock[])
      : undefined,
    uploadFile: handleUpload,
  });

  return (
    <div className="z-50">
      <BlockNoteView
        editor={editor}
        editable
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        onChange={() => {
          onChange(JSON.stringify(editor.document));
        }}
      >
        <SideMenuController
          sideMenu={(props) => (
            <SideMenu {...props}>
              {/* Button which removes the hovered block. */}
            </SideMenu>
          )}
        />
      </BlockNoteView>
    </div>
  );
};
