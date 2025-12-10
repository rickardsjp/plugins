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
import {
  Box,
  Collapse,
  useTheme,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import ContentCopy from 'mdi-material-ui/ContentCopy';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import FormatQuoteClose from 'mdi-material-ui/FormatQuoteClose';
import CodeJson from 'mdi-material-ui/CodeJson';
import { LogEntry } from '@perses-dev/core';
import { LogTimestamp } from './LogTimestamp';
import { LogRowContainer, LogRowContent, ExpandButton, LogText } from './LogsStyles';
import { LogDetailsTable } from './LogDetailsTable';
import { formatLogEntry, formatLogMessage, formatLogAsJson, copyToClipboard } from '../../utils/copyHelpers';

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    if (isExpandable) {
      onToggle(index);
    }
  }, [isExpandable, onToggle, index]);

  const handleOpenMenu = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null);
    setIsHovered(false);
  }, []);

  const handleCopy = useCallback(
    async (format: 'full' | 'message' | 'json') => {
      if (!log) return;

      let text: string;
      switch (format) {
        case 'message':
          text = formatLogMessage(log);
          break;
        case 'json':
          text = formatLogAsJson(log);
          break;
        case 'full':
        default:
          text = formatLogEntry(log);
      }

      await copyToClipboard(text);
      handleCloseMenu();
    },
    [log, handleCloseMenu]
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
      onMouseLeave={() => {
        if (!anchorEl) {
          setIsHovered(false);
        }
      }}
      onCopy={handleCopyEvent}
      data-log-index={index}
    >
      <LogRowContent
        ref={contentRef}
        onClick={handleToggle}
        isExpandable={isExpandable}
        isHighlighted={Boolean(anchorEl)}
      >
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
          <Tooltip title="Copy options">
            <IconButton
              size="small"
              onClick={handleOpenMenu}
              sx={{
                padding: '4px',
                marginLeft: 'auto',
                color: theme.palette.text.secondary,
                opacity: isHovered || Boolean(anchorEl) ? 1 : 0,
                pointerEvents: isHovered || Boolean(anchorEl) ? 'auto' : 'none',
                transition: 'opacity 0.08s ease',
                '&:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: theme.palette.action.hover,
                },
                borderRadius: '4px',
                display: 'flex',
                gap: '2px',
              }}
            >
              <ContentCopy sx={{ fontSize: '14px' }} />
              <ChevronDown sx={{ fontSize: '12px' }} />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            onClick={(e) => e.stopPropagation()}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                mt: 0.5,
                minWidth: 180,
                boxShadow: theme.shadows[3],
              },
            }}
          >
            <MenuItem
              onClick={() => handleCopy('full')}
              sx={{
                py: 1,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon>
                <ContentCopy fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Copy log"
                secondary="Timestamp + labels + message"
                primaryTypographyProps={{ fontSize: '14px' }}
                secondaryTypographyProps={{ fontSize: '11px' }}
              />
            </MenuItem>
            <MenuItem
              onClick={() => handleCopy('message')}
              sx={{
                py: 1,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon>
                <FormatQuoteClose fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Copy message"
                secondary="Message text only"
                primaryTypographyProps={{ fontSize: '14px' }}
                secondaryTypographyProps={{ fontSize: '11px' }}
              />
            </MenuItem>
            <MenuItem
              onClick={() => handleCopy('json')}
              sx={{
                py: 1,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon>
                <CodeJson fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Copy as JSON"
                secondary="Full log entry"
                primaryTypographyProps={{ fontSize: '14px' }}
                secondaryTypographyProps={{ fontSize: '11px' }}
              />
            </MenuItem>
          </Menu>
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
