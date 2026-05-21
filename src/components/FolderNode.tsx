import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, Plus, Trash2, Edit2 } from 'lucide-react';
import { TreeNode } from '../types';

interface FolderNodeProps {
  node: TreeNode;
  level: number;
  onSelectFolder: (path: string) => void;
  selectedPath: string | null;
  onAction?: (action: 'create' | 'delete' | 'rename', path: string) => void;
  onMove?: (sourcePath: string, targetPath: string) => void;
  onUploadFiles?: (e: React.DragEvent, path: string) => void;
}

export const FolderNode: React.FC<FolderNodeProps> = ({
  node,
  level,
  onSelectFolder,
  selectedPath,
  onAction,
  onMove,
  onUploadFiles
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  
  useEffect(() => {
    if (level === 0) setExpanded(true);
  }, [level]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleClick = () => {
    onSelectFolder(node.path);
  };

  const isSelected = selectedPath === node.path;
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('sourcePath', node.path);
    e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const types = Array.from(e.dataTransfer.types).map(t => String(t).toLowerCase());
    if (types.includes('files') || types.includes('sourcepath')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    // Check if dragging external files
    const types = Array.from(e.dataTransfer.types).map(t => String(t).toLowerCase());
    if (types.includes('files')) {
      if (onUploadFiles) {
        onUploadFiles(e, node.path);
      }
      return;
    }

    const sourcePath = e.dataTransfer.getData('sourcePath');
    if (sourcePath && sourcePath !== node.path && onMove) {
      onMove(sourcePath, node.path);
    }
  };

  return (
    <div>
      <div 
        draggable={level > 0}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group flex items-center py-0.5 px-1 cursor-pointer select-none transition-colors ${isSelected ? 'bg-fb-hl text-white' : 'hover:bg-[#1a1a1a]'} ${isDragOver ? 'ring-1 ring-inset ring-[#ff9900] bg-[#222]' : ''}`}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={handleClick}
      >
        <span onClick={hasChildren ? toggleExpand : undefined} className="mr-1 opacity-70 hover:opacity-100 flex-shrink-0 w-3 h-3 flex items-center justify-center">
          {hasChildren ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3" />}
        </span>
        <Folder size={12} className="mr-1 flex-shrink-0 text-[#aaaaaa]" />
        <span className="truncate flex-1">{node.name}</span>
        
        {isSelected && onAction && (
          <div className="flex gap-1 pr-1">
            <button onClick={(e) => { e.stopPropagation(); onAction('create', node.path); }} className="hover:text-[#ff9900]" title="New Folder"><Plus size={12} /></button>
            {level > 0 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); onAction('rename', node.path); }} className="hover:text-[#ff9900]" title="Rename"><Edit2 size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); onAction('delete', node.path); }} className="hover:text-[#ff2222]" title="Delete"><Trash2 size={12} /></button>
              </>
            )}
          </div>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child, idx) => (
            <FolderNode 
              key={idx} 
              node={child} 
              level={level + 1} 
              onSelectFolder={onSelectFolder}
              selectedPath={selectedPath}
              onAction={onAction}
              onMove={onMove}
              onUploadFiles={onUploadFiles}
            />
          ))}
        </div>
      )}
    </div>
  );
}
