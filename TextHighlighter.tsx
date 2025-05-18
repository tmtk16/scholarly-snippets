import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Highlight {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  comment: string;
  color: string;
}

interface TextHighlighterProps {
  text: string;
  readOnly?: boolean;
  highlights?: Highlight[];
  onHighlightsChange?: (highlights: Highlight[]) => void;
}

export default function TextHighlighter({ 
  text, 
  readOnly = false, 
  highlights: initialHighlights = [], 
  onHighlightsChange 
}: TextHighlighterProps) {
  const [textContent, setTextContent] = useState(text);
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentComment, setCurrentComment] = useState("");
  const [highlightColor, setHighlightColor] = useState("#FFEB3B"); // Default yellow
  const textRef = useRef<HTMLDivElement>(null);

  // Update text content when text prop changes
  useEffect(() => {
    setTextContent(text);
  }, [text]);

  // Update highlights when initialHighlights changes
  useEffect(() => {
    setHighlights(initialHighlights);
  }, [initialHighlights]);

  // Notify parent component of highlight changes
  useEffect(() => {
    if (onHighlightsChange) {
      onHighlightsChange(highlights);
    }
  }, [highlights, onHighlightsChange]);

  // Handle text selection
  const handleSelection = () => {
    if (readOnly) return;
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    
    // Get the text container element
    const container = textRef.current;
    if (!container) return;
    
    // Get selected text and its position
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();
    
    if (!selectedText) return;
    
    // Calculate the start and end indices relative to the text content
    const selectionStart = getTextOffset(container, range.startContainer, range.startOffset);
    const selectionEnd = getTextOffset(container, range.endContainer, range.endOffset);
    
    if (selectionStart !== null && selectionEnd !== null) {
      setSelection({ start: selectionStart, end: selectionEnd });
      setIsDialogOpen(true);
    }
  };

  // Calculate text offset from node position
  const getTextOffset = (
    container: Node, 
    targetNode: Node, 
    offset: number
  ): number | null => {
    // Create a range from the beginning of the container to the target position
    const range = document.createRange();
    range.setStart(container, 0);
    range.setEnd(targetNode, offset);
    
    // Get the text within this range
    const beforeText = range.toString();
    return beforeText.length;
  };

  // Add a new highlight
  const addHighlight = () => {
    if (!selection) return;
    
    const newHighlight: Highlight = {
      id: Date.now().toString(),
      text: textContent.substring(selection.start, selection.end),
      startIndex: selection.start,
      endIndex: selection.end,
      comment: currentComment,
      color: highlightColor
    };
    
    setHighlights([...highlights, newHighlight]);
    setSelection(null);
    setCurrentComment("");
    setIsDialogOpen(false);
  };

  // Remove a highlight
  const removeHighlight = (id: string) => {
    setHighlights(highlights.filter(h => h.id !== id));
  };

  // Render text with highlights
  const renderHighlightedText = () => {
    if (!textContent) return null;
    
    // Sort highlights by start index, with longer highlights coming first
    // This prevents nested highlights from breaking
    const sortedHighlights = [...highlights].sort((a, b) => {
      if (a.startIndex === b.startIndex) {
        return b.endIndex - a.endIndex; // Longer highlights first
      }
      return a.startIndex - b.startIndex;
    });
    
    let lastIndex = 0;
    const elements: JSX.Element[] = [];
    
    // Process each highlight
    sortedHighlights.forEach((highlight, index) => {
      // Add text before the highlight
      if (highlight.startIndex > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {textContent.substring(lastIndex, highlight.startIndex)}
          </span>
        );
      }
      
      // Add the highlighted text
      elements.push(
        <span 
          key={`highlight-${highlight.id}`}
          style={{ 
            backgroundColor: highlight.color,
            position: 'relative',
            cursor: highlight.comment ? 'help' : 'default',
          }}
          title={highlight.comment}
          data-highlight-id={highlight.id}
          className="group"
        >
          {textContent.substring(highlight.startIndex, highlight.endIndex)}
          
          {/* Show comment tooltip on hover */}
          {highlight.comment && (
            <span 
              className="absolute bottom-full left-0 mb-2 invisible group-hover:visible 
                        bg-background border rounded p-2 shadow-md max-w-xs z-10"
            >
              {highlight.comment}
              {!readOnly && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="ml-2 h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHighlight(highlight.id);
                  }}
                >
                  ×
                </Button>
              )}
            </span>
          )}
        </span>
      );
      
      lastIndex = highlight.endIndex;
    });
    
    // Add any remaining text
    if (lastIndex < textContent.length) {
      elements.push(
        <span key="text-end">
          {textContent.substring(lastIndex)}
        </span>
      );
    }
    
    return elements;
  };

  return (
    <div className="w-full">
      <div 
        ref={textRef}
        className={`w-full p-4 border rounded-md bg-background ${!readOnly ? 'cursor-text' : ''}`}
        onMouseUp={handleSelection}
        style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
      >
        {renderHighlightedText()}
      </div>
      
      {/* Dialog for adding comments to highlights */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a Comment</DialogTitle>
          </DialogHeader>
          
          {selection && (
            <div className="bg-muted p-3 rounded-md my-4">
              <p className="font-medium">Selected text:</p>
              <p className="italic mt-1 text-sm">
                {textContent.substring(selection.start, selection.end)}
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Comment</label>
              <Textarea
                value={currentComment}
                onChange={(e) => setCurrentComment(e.target.value)}
                placeholder="Add your comment about this text..."
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Highlight Color</label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="w-12 h-8 p-0 cursor-pointer"
                />
                <div className="flex gap-2">
                  {['#FFEB3B', '#4CAF50', '#FF9800', '#2196F3', '#F44336'].map(color => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: color }}
                      onClick={() => setHighlightColor(color)}
                      aria-label={`Set highlight color to ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={addHighlight}>Save Comment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}