import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder } from 'lucide-react';
import { TreeNode } from '../types';

interface FolderNodeProps {
  node: TreeNode;
  level: number;
  onSelectFolder: (path: string) => void;
  selectedPath: string | null;
}

export const FolderNode: React.FC<FolderNodeProps> = ({
  node,
  level,
  onSelectFolder,
  selectedPath
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  
  // Expand root level by default
  useEffect(() => {
    if (level === 0) {
      setExpanded(true);
    }
  }, [level]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleClick = () => {
    onSelectFolder(node.path);
  };

  const isSelected = selectedPath === node.path;

  return (
    <div>
      <div 
        className={`flex items-center py-0.5 px-1 cursor-pointer select-none transition-colors ${isSelected ? 'bg-fb-hl text-white' : 'hover:bg-[#1a1a1a]'}`}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={handleClick}
      >
        <span onClick={hasChildren ? toggleExpand : undefined} className="mr-1 opacity-70 hover:opacity-100 flex-shrink-0 w-3 h-3 flex items-center justify-center">
          {hasChildren ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3" />}
        </span>
        <Folder size={12} className="mr-1 flex-shrink-0 text-[#aaaaaa]" />
        <span className="truncate">{node.name}</span>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
