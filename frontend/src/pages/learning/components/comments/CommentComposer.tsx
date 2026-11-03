import React, { useState } from 'react';
import { Avatar, Button, Input, Space, Typography, theme } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

export interface CommentComposerProps {
  userAvatar?: string | null;
  userName?: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  submitting?: boolean;
  autoFocus?: boolean;
  showCancel?: boolean;
  compact?: boolean;
  onSubmit: (content: string) => Promise<boolean | void>;
  onCancel?: () => void;
}

export const CommentComposer: React.FC<CommentComposerProps> = ({
  userAvatar,
  userName,
  placeholder = 'Ask a question or share your thoughts on this lesson...',
  initialValue = '',
  submitLabel = 'Post Comment',
  submitting = false,
  autoFocus = false,
  showCancel = false,
  compact = false,
  onSubmit,
  onCancel,
}) => {
  const { token } = theme.useToken();
  const [content, setContent] = useState<string>(initialValue);

  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const result = await onSubmit(trimmed);
    if (result !== false && !initialValue) {
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const userInitial = userName ? userName.charAt(0).toUpperCase() : undefined;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: compact ? 10 : 14,
      }}
    >
      {!showCancel && (
        <Avatar
          size={compact ? 32 : 38}
          src={userAvatar || undefined}
          icon={!userAvatar && !userInitial ? <UserOutlined /> : undefined}
          style={{
            backgroundColor: '#fef9c3',
            color: token.colorText,
            fontWeight: 700,
            border: `1px solid ${token.colorText}`,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          {!userAvatar ? userInitial : null}
        </Avatar>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={2000}
          autoSize={{ minRows: compact ? 2 : 3, maxRows: 8 }}
          disabled={submitting}
          style={{
            borderRadius: 4,
            borderColor: token.colorBorder,
            fontSize: 14,
            lineHeight: 1.6,
            padding: '10px 12px',
            backgroundColor: '#fcfff7',
            color: token.colorText,
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 10,
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            Press <Text keyboard>Ctrl</Text> + <Text keyboard>Enter</Text> to submit
          </Text>

          <Space size={8}>
            {showCancel && onCancel && (
              <Button
                size={compact ? 'small' : 'middle'}
                onClick={onCancel}
                disabled={submitting}
                style={{
                  borderRadius: 4,
                  fontWeight: 500,
                  borderColor: token.colorBorder,
                  color: token.colorTextSecondary,
                }}
              >
                Cancel
              </Button>
            )}

            <Button
              type="primary"
              size={compact ? 'small' : 'middle'}
              icon={<SendOutlined />}
              loading={submitting}
              disabled={!trimmed}
              onClick={() => void handleSubmit()}
              style={{
                borderRadius: 4,
                fontWeight: 700,
                backgroundColor: trimmed ? token.colorPrimary : undefined,
                color: trimmed ? token.colorText : undefined,
                border: trimmed ? `1px solid ${token.colorText}` : undefined,
                boxShadow: trimmed ? '2px 2px 0px 0px #262626' : 'none',
              }}
            >
              {submitLabel}
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

