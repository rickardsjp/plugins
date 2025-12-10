// Copyright 2025 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useCallback } from 'react';
import { Box, useTheme } from '@mui/material';
import { Virtuoso } from 'react-virtuoso';
import { LogEntry } from '@perses-dev/core';
import { LogsTableOptions } from '../model';
import { LogRow } from './LogRow/LogRow';
import { formatLogEntries } from '../utils/copyHelpers';

interface VirtualizedLogsListProps {
  logs: LogEntry[];
  spec: LogsTableOptions;
  expandedRows: Set<number>;
  onToggleExpand: (index: number) => void;
}

export const VirtualizedLogsList: React.FC<VirtualizedLogsListProps> = ({
  logs,
  spec,
  expandedRows,
  onToggleExpand,
}) => {
  const theme = useTheme();

  const renderLogRow = (index: number) => {
    const log = logs[index];
    if (!log) return null;

    return (
      <LogRow
        isExpandable={spec.enableDetails}
        log={log}
        index={index}
        isExpanded={expandedRows.has(index)}
        onToggle={onToggleExpand}
        allowWrap={spec.allowWrap}
        showTime={spec.showTime}
      />
    );
  };

  const handleCopy = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      // Get all selected log row elements
      const range = selection.getRangeAt(0);
      const container = e.currentTarget;

      // Find all log rows that intersect with the selection
      const selectedLogs: LogEntry[] = [];
      const logElements = container.querySelectorAll('[data-log-index]');

      logElements.forEach((element) => {
        if (selection.containsNode(element, true)) {
          const index = parseInt(element.getAttribute('data-log-index') || '-1', 10);
          if (index >= 0 && index < logs.length) {
            const log = logs[index];
            if (log) {
              selectedLogs.push(log);
            }
          }
        }
      });

      // If we found selected logs, format and copy them
      if (selectedLogs.length > 0) {
        e.preventDefault();
        const formattedText = formatLogEntries(selectedLogs);
        e.clipboardData.setData('text/plain', formattedText);
      }
    },
    [logs]
  );

  return (
    <Box
      sx={{
        height: '100%',
        backgroundColor: theme.palette.background.default,
        overflow: 'hidden',
        boxShadow: theme.shadows[1],
      }}
      onCopy={handleCopy}
    >
      <Virtuoso
        style={{ height: '100%' }}
        initialItemCount={spec.showAll ? logs.length : undefined}
        totalCount={logs.length}
        itemContent={renderLogRow}
      />
    </Box>
  );
};
