"use client";

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

interface MathRendererProps {
  children: string;
  className?: string;
}

/**
 * MathRenderer component that intelligently renders text with LaTeX math expressions
 * 
 * Supports:
 * - Inline math: $x = 2$ or \(x = 2\)
 * - Block math: $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$ or \[x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}\]
 * - Mixed content: "The equation $x^2 + y^2 = r^2$ represents a circle"
 * 
 * Usage examples:
 * <MathRenderer>The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$</MathRenderer>
 * <MathRenderer>$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$</MathRenderer>
 */
export const MathRenderer: React.FC<MathRendererProps> = ({ children, className = "" }) => {
  if (!children) return null;

  // Function to parse text and extract math expressions
  const parseContent = (text: string) => {
    const parts: Array<{ type: 'text' | 'inline-math' | 'block-math'; content: string; key: string }> = [];
    let remaining = text;
    let counter = 0;

    // First, handle block math ($$...$$) and \[...\]
    const blockMathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g;
    let lastIndex = 0;
    let match;

    while ((match = blockMathRegex.exec(text)) !== null) {
      // Add text before the math
      if (match.index > lastIndex) {
        const textPart = text.slice(lastIndex, match.index);
        if (textPart.trim()) {
          parts.push({
            type: 'text',
            content: textPart,
            key: `text-${counter++}`
          });
        }
      }

      // Add the block math
      let mathContent = match[1];
      if (mathContent.startsWith('$$') && mathContent.endsWith('$$')) {
        mathContent = mathContent.slice(2, -2);
      } else if (mathContent.startsWith('\\[') && mathContent.endsWith('\\]')) {
        mathContent = mathContent.slice(2, -2);
      }

      parts.push({
        type: 'block-math',
        content: mathContent,
        key: `block-math-${counter++}`
      });

      lastIndex = match.index + match[1].length;
    }

    // Add remaining text after block math
    if (lastIndex < text.length) {
      remaining = text.slice(lastIndex);
    } else {
      remaining = '';
    }

    // Now handle inline math in the remaining text ($...$) and \(...\)
    if (remaining) {
      const inlineMathRegex = /(\$[^$\n]+\$|\\\([^)]+\\\))/g;
      const remainingParts = [];
      let lastInlineIndex = 0;
      let inlineMatch;

      while ((inlineMatch = inlineMathRegex.exec(remaining)) !== null) {
        // Add text before the inline math
        if (inlineMatch.index > lastInlineIndex) {
          const textPart = remaining.slice(lastInlineIndex, inlineMatch.index);
          if (textPart.trim()) {
            remainingParts.push({
              type: 'text',
              content: textPart,
              key: `text-${counter++}`
            });
          }
        }

        // Add the inline math
        let mathContent = inlineMatch[1];
        if (mathContent.startsWith('$') && mathContent.endsWith('$')) {
          mathContent = mathContent.slice(1, -1);
        } else if (mathContent.startsWith('\\(') && mathContent.endsWith('\\)')) {
          mathContent = mathContent.slice(2, -2);
        }

        remainingParts.push({
          type: 'inline-math',
          content: mathContent,
          key: `inline-math-${counter++}`
        });

        lastInlineIndex = inlineMatch.index + inlineMatch[1].length;
      }

      // Add final text after inline math
      if (lastInlineIndex < remaining.length) {
        const finalText = remaining.slice(lastInlineIndex);
        if (finalText.trim()) {
          remainingParts.push({
            type: 'text',
            content: finalText,
            key: `text-${counter++}`
          });
        }
      }

      // If no inline math was found, add the remaining text as a single part
      if (remainingParts.length === 0 && remaining.trim()) {
        remainingParts.push({
          type: 'text',
          content: remaining,
          key: `text-${counter++}`
        });
      }

      // Insert the remaining parts into the main parts array
      parts.push(...remainingParts);
    }

    // If no math was found at all, return the original text as a single text part
    if (parts.length === 0) {
      parts.push({
        type: 'text',
        content: text,
        key: `text-${counter++}`
      });
    }

    return parts;
  };

  const parts = parseContent(children);

  return (
    <span className={className}>
      {parts.map((part) => {
        switch (part.type) {
          case 'block-math':
            return (
              <div key={part.key} className="my-2">
                <BlockMath math={part.content} />
              </div>
            );
          case 'inline-math':
            return (
              <InlineMath key={part.key} math={part.content} />
            );
          case 'text':
          default:
            return (
              <span key={part.key}>
                {part.content}
              </span>
            );
        }
      })}
    </span>
  );
};

export default MathRenderer; 