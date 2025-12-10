// Copyright 2025 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { memo, useCallback, useState, useRef, ClipboardEvent } from 'react';
import { Box, Collapse, useTheme, IconButton, Tooltip } from '@mui/material';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import ContentCopy from 'mdi-material-ui/ContentCopy';
import { LogEntry } from '@perses-dev/core';
import { LogTimestamp } from './LogTimestamp';
import { LogRowContainer, LogRowContent, ExpandButton, LogText } from './LogsStyles';
import { LogDetailsTable } from './LogDetailsTable';
import { formatLogEntry, copyToClipboard } from '../../utils/copyHelpers';

interface LogRowProps {
  log?: LogEntry;
  index: number;
  isExpanded: boolean;
  onToggle: (index: number) => void;
  isExpandable?: boolean;
  showTime?: boolean;
  allowWrap?: boolean;
}

const DefaultLogRow: React.FC<LogRowProps> = ({
  log,
  isExpanded,
  index,
  onToggle,
  isExpandable = true,
  showTime = false,
  allowWrap = false,
}) => {
  const theme = useTheme();
  const severityColor = theme.palette.text.secondary;
  const [isHovered, setIsHovered] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    if (isExpandable) {
      onToggle(index);
    }
  }, [isExpandable, onToggle, index]);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (log) {
        await copyToClipboard(formatLogEntry(log));
      }
    },
    [log]
  );

  const handleCopyEvent = useCallback(
    (e: ClipboardEvent<HTMLDivElement>) => {
      if (!log) return;

      // Get the selected text from the DOM
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      // Check if the selection is within this row
      const range = selection.getRangeAt(0);
      if (!rowRef.current?.contains(range.commonAncestorContainer)) return;

      // Prevent the default copy behavior and format the log entry with labels
      e.preventDefault();
      const formattedText = formatLogEntry(log);
      e.clipboardData.setData('text/plain', formattedText);
    },
    [log]
  );

  if (!log) return null;

  return (
    <LogRowContainer
      severityColor={severityColor}
      ref={rowRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onCopy={handleCopyEvent}
      data-log-index={index}
    >
      <LogRowContent ref={contentRef} onClick={handleToggle} isExpandable={isExpandable}>
        {isExpandable && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '16px',
              justifyContent: 'center',
            }}
          >
            <ExpandButton size="small" isExpanded={isExpanded}>
              <ChevronRight sx={{ fontSize: '12px' }} />
            </ExpandButton>
          </Box>
        )}

        <LogTimestamp timestamp={log.timestamp} />

        <Box
          sx={{
            display: 'flex',
            gap: '10px',
            marginLeft: '36px',
            alignItems: 'center',
          }}
        >
          <LogText variant="body2" allowWrap={allowWrap}>
            {log.line}
          </LogText>
          {isHovered && (
            <Tooltip title="Copy log">
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{
                  padding: '2px',
                  marginLeft: 'auto',
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                <ContentCopy sx={{ fontSize: '14px' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </LogRowContent>

      <Collapse in={isExpanded} timeout={200}>
        <Box ref={detailsRef} sx={{ padding: '8px' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: !showTime ? '1fr' : '8px minmax(160px, max-content) 1fr',
              gap: '12px',
            }}
          >
            {showTime && (
              <>
                <Box />
                <Box />
              </>
            )}
            <Box>
              <LogDetailsTable log={log.labels} />
            </Box>
          </Box>
        </Box>
      </Collapse>
    </LogRowContainer>
  );
};

export const LogRow = memo(DefaultLogRow);
LogRow.displayName = 'LogRow';
