"use client";

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Button } from './button';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Underline as UnderlineIcon,
  Palette,
  Upload,
  Image as ImageIcon,
  Strikethrough,
  Code,
  Eraser
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </Button>
             <Button
         variant="ghost"
         size="sm"
         onClick={() => editor.chain().focus().redo().run()}
         disabled={!editor.can().redo()}
       >
         <Redo className="h-4 w-4" />
       </Button>
       <Button
         variant="ghost"
         size="sm"
         onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
         title="Clear Formatting"
       >
         <Eraser className="h-4 w-4" />
       </Button>
       
       <div className="w-px h-6 bg-gray-300 mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-gray-200' : ''}
      >
        <Bold className="h-4 w-4" />
      </Button>
             <Button
         variant="ghost"
         size="sm"
         onClick={() => editor.chain().focus().toggleItalic().run()}
         className={editor.isActive('italic') ? 'bg-gray-200' : ''}
       >
         <Italic className="h-4 w-4" />
       </Button>
                       <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-gray-200' : ''}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'bg-gray-200' : ''}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'bg-gray-200' : ''}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
                 <div className="relative">
           <input
             type="color"
             className="w-8 h-8 rounded border-0 cursor-pointer opacity-0 absolute inset-0"
             onChange={(e) => {
               const color = e.target.value;
               editor.chain().focus().setColor(color).run();
             }}
             title="Text Color"
           />
           <Button
             variant="ghost"
             size="sm"
             className="w-8 h-8 p-0"
             title="Text Color"
           >
             <Palette className="h-4 w-4" />
           </Button>
         </div>
       
       <Button
         variant="ghost"
         size="sm"
         onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
         className={editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
         title="Heading 1"
       >
         <Heading1 className="h-4 w-4" />
       </Button>
       <Button
         variant="ghost"
         size="sm"
         onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
         className={editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
         title="Heading 2"
       >
         <Heading2 className="h-4 w-4" />
       </Button>
       <Button
         variant="ghost"
         size="sm"
         onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
         className={editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
         title="Heading 3"
       >
         <Heading3 className="h-4 w-4" />
       </Button>
       
       <div className="w-px h-6 bg-gray-300 mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
      >
        <Quote className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-gray-300 mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
        title="Justify"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-gray-300 mx-1" />
      
             <Button
         variant="ghost"
         size="sm"
         onClick={() => {
           const url = window.prompt('Enter URL');
           if (url) {
             editor.chain().focus().setLink({ href: url }).run();
           }
         }}
         className={editor.isActive('link') ? 'bg-gray-200' : ''}
       >
         <LinkIcon className="h-4 w-4" />
       </Button>
       
       <div className="w-px h-6 bg-gray-300 mx-1" />
       
       <div className="relative">
         <input
           type="file"
           accept="image/*"
           className="w-8 h-8 rounded border-0 cursor-pointer opacity-0 absolute inset-0"
           onChange={(e) => {
             const file = e.target.files?.[0];
             if (file) {
               const reader = new FileReader();
               reader.onload = (event) => {
                 const result = event.target?.result as string;
                 editor.chain().focus().setImage({ src: result }).run();
               };
               reader.readAsDataURL(file);
             }
           }}
           title="Upload Image"
         />
         <Button
           variant="ghost"
           size="sm"
           className="w-8 h-8 p-0"
           title="Upload Image"
         >
           <Upload className="h-4 w-4" />
         </Button>
       </div>
       
       <Button
         variant="ghost"
         size="sm"
         onClick={() => {
           const url = window.prompt('Enter image URL');
           if (url) {
             editor.chain().focus().setImage({ src: url }).run();
           }
         }}
         title="Insert Image URL"
       >
         <ImageIcon className="h-4 w-4" />
       </Button>
    </div>
  );
};

const RichTextEditorComponent: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing...',
  className = ''
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
         extensions: [
       StarterKit.configure({
         heading: {
           levels: [1, 2, 3]
         }
       }),
       Link.configure({
         openOnClick: false,
         HTMLAttributes: {
           class: 'text-blue-600 underline cursor-pointer'
         }
       }),
       Image,
       Underline,
       TextStyle,
       Color,
       TextAlign.configure({
         types: ['heading', 'paragraph'],
         alignments: ['left', 'center', 'right', 'justify'],
         defaultAlignment: 'left'
       })
     ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
         editorProps: {
       attributes: {
         class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] p-3 [&_.ProseMirror]:min-h-[150px]'
       }
     },
    immediatelyRender: false
  });

  if (!isMounted) {
    return (
      <div className={`border border-gray-300 rounded-md overflow-hidden ${className}`}>
        <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
                 <div className="min-h-[150px] p-3 bg-gray-50 animate-pulse">
           <div className="h-4 bg-gray-200 rounded mb-2"></div>
           <div className="h-4 bg-gray-200 rounded w-3/4"></div>
         </div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-300 rounded-md overflow-hidden ${className}`}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      {!value && (
        <div className="absolute top-12 left-4 text-gray-400 pointer-events-none">
          {placeholder}
        </div>
      )}
             <style jsx>{`
         .ProseMirror {
           min-height: 150px;
           padding: 12px;
         }
         .ProseMirror p[style*="text-align: left"] {
           text-align: left !important;
         }
         .ProseMirror p[style*="text-align: center"] {
           text-align: center !important;
         }
         .ProseMirror p[style*="text-align: right"] {
           text-align: right !important;
         }
         .ProseMirror p[style*="text-align: justify"] {
           text-align: justify !important;
         }

       `}</style>
    </div>
  );
};

export const RichTextEditor = RichTextEditorComponent; 