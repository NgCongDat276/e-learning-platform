import React, { useState } from 'react';
import { Avatar, Button, Popconfirm, Space, Tag, Typography, theme } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { LessonCommentItem } from '../../../../types/comment.types';
import { CommentComposer } from './CommentComposer';

const { Text, Paragraph } = Typography;

export interface CommentItemProps {
  comment: LessonCommentItem;
  currentUserId?: string;
  currentUserRole?: string;
  currentUserAvatar?: string | null;
  currentUserName?: string;
  courseLecturerId?: string;
  isReply?: boolean;
  onReplySubmit: (parentCommentId: string, content: string) => Promise<boolean>;
  onEditSubmit: (commentId: string, content: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<void>;
}

/**
 * Helper: Định dạng thời gian tương đối thân thiện
 */
const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSeconds < 45) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  currentUserRole,
  currentUserAvatar,
  currentUserName,
  courseLecturerId,
  isReply = false,
  onReplySubmit,
  onEditSubmit,
  onDelete,
}) => {
  const { token } = theme.useToken();

  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const isCommentOwner = Boolean(currentUserId && comment.user.id === currentUserId);
  const isCurrentUserCourseLecturer = Boolean(
    currentUserId && courseLecturerId && currentUserId === courseLecturerId
  );
  const isCurrentUserAdmin = currentUserRole === 'admin';

  const canEdit = isCommentOwner;
  const canDelete =
    isCommentOwner || isCurrentUserCourseLecturer || isCurrentUserAdmin;

  // Kiểm tra xem bình luận đã từng được chỉnh sửa chưa (chênh lệch > 2 giây)
  const isEdited =
    Boolean(comment.created_at && comment.updated_at) &&
    new Date(comment.updated_at).getTime() -
      new Date(comment.created_at).getTime() >
      2000;

  // Luôn quy về ID của bình luận gốc cấp 1 khi trả lời
  const targetRootId = comment.parent_comment_id || comment.id;

  const handleReply = async (content: string): Promise<boolean> => {
    setSubmittingReply(true);
    try {
      const ok = await onReplySubmit(targetRootId, content);
      if (ok) {
        setIsReplying(false);
      }
      return ok;
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleEdit = async (content: string): Promise<boolean> => {
    setSubmittingEdit(true);
    try {
      const ok = await onEditSubmit(comment.id, content);
      if (ok) {
        setIsEditing(false);
      }
      return ok;
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setDeleting(false);
    }
  };

  const authorInitial = comment.user.full_name
    ? comment.user.full_name.charAt(0).toUpperCase()
    : undefined;

  return (
    <div
      style={{
        paddingTop: isReply ? 14 : 18,
        paddingBottom: isReply ? 6 : 18,
        borderBottom: isReply ? 'none' : `1px solid ${token.colorBorder}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Avatar */}
        <Avatar
          size={isReply ? 30 : 36}
          src={comment.user.avatar_url || undefined}
          icon={!comment.user.avatar_url && !authorInitial ? <UserOutlined /> : undefined}
          style={{
            backgroundColor: comment.user.is_course_lecturer ? '#dcfff1' : '#f5f5f4',
            color: comment.user.is_course_lecturer ? '#065f46' : token.colorText,
            fontWeight: 700,
            border: `1px solid ${
              comment.user.is_course_lecturer ? '#059669' : token.colorText
            }`,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          {!comment.user.avatar_url ? authorInitial : null}
        </Avatar>

        {/* Main Content Column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header: Name + Role Badge + Timestamp */}
          <Space size={8} wrap align="center" style={{ marginBottom: 4 }}>
            <Text
              strong
              style={{
                fontSize: isReply ? 13.5 : 14.5,
                color: token.colorText,
              }}
            >
              {comment.user.full_name}
            </Text>

            {comment.user.is_course_lecturer && (
              <Tag
                icon={<SafetyCertificateOutlined />}
                style={{
                  margin: 0,
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '0 8px',
                  lineHeight: '18px',
                  backgroundColor: '#dcfff1',
                  borderColor: '#7ee2b8',
                  color: '#065f46',
                }}
              >
                Instructor
              </Tag>
            )}

            {!comment.user.is_course_lecturer && comment.user.role === 'admin' && (
              <Tag
                style={{
                  margin: 0,
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '0 8px',
                  lineHeight: '18px',
                  backgroundColor: '#eff6ff',
                  borderColor: '#bfdbfe',
                  color: '#1d4ed8',
                }}
              >
                Admin
              </Tag>
            )}

            <Text type="secondary" style={{ fontSize: 12 }}>
              • {formatRelativeTime(comment.created_at)}
              {isEdited ? ' (edited)' : ''}
            </Text>
          </Space>

          {/* Body or Inline Editor */}
          {isEditing ? (
            <div style={{ marginTop: 8, marginBottom: 4 }}>
              <CommentComposer
                initialValue={comment.content}
                submitLabel="Save Changes"
                submitting={submittingEdit}
                autoFocus
                showCancel
                compact
                onSubmit={handleEdit}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          ) : (
            <Paragraph
              style={{
                margin: '4px 0 8px 0',
                fontSize: 14.5,
                lineHeight: 1.65,
                color: token.colorText,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {comment.content}
            </Paragraph>
          )}

          {/* Action Buttons */}
          {!isEditing && (
            <Space size={12} style={{ marginLeft: -6 }}>
              <Button
                type="text"
                size="small"
                icon={<MessageOutlined style={{ fontSize: 12 }} />}
                onClick={() => setIsReplying((prev) => !prev)}
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: isReplying ? token.colorText : token.colorTextSecondary,
                  padding: '0 6px',
                  height: 24,
                }}
              >
                Reply
              </Button>

              {canEdit && (
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined style={{ fontSize: 12 }} />}
                  onClick={() => {
                    setIsEditing(true);
                    setIsReplying(false);
                  }}
                  style={{
                    fontSize: 12.5,
                    color: token.colorTextSecondary,
                    padding: '0 6px',
                    height: 24,
                  }}
                >
                  Edit
                </Button>
              )}

              {canDelete && (
                <Popconfirm
                  title="Delete this comment?"
                  description="This action cannot be undone."
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{
                    danger: true,
                    loading: deleting,
                    style: { borderRadius: 4, fontWeight: 600 },
                  }}
                  cancelButtonProps={{
                    style: { borderRadius: 4 },
                  }}
                  onConfirm={() => void handleDeleteConfirm()}
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                    style={{
                      fontSize: 12.5,
                      padding: '0 6px',
                      height: 24,
                    }}
                  >
                    Delete
                  </Button>
                </Popconfirm>
              )}
            </Space>
          )}

          {/* Inline Reply Composer */}
          {isReplying && (
            <div
              style={{
                marginTop: 12,
                padding: '12px 14px',
                backgroundColor: '#fcfff7',
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 6,
              }}
            >
              <CommentComposer
                userAvatar={currentUserAvatar}
                userName={currentUserName}
                placeholder={`Reply to ${comment.user.full_name}...`}
                initialValue={
                  isReply ? `@${comment.user.full_name} ` : ''
                }
                submitLabel="Post Reply"
                submitting={submittingReply}
                autoFocus
                showCancel
                compact
                onSubmit={handleReply}
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}

          {/* Nested Replies (Level 2) */}
          {!isReply && comment.replies && comment.replies.length > 0 && (
            <div
              style={{
                marginTop: 10,
                paddingLeft: 18,
                borderLeft: `2px solid ${token.colorBorder}`,
              }}
            >
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  currentUserAvatar={currentUserAvatar}
                  currentUserName={currentUserName}
                  courseLecturerId={courseLecturerId}
                  isReply
                  onReplySubmit={onReplySubmit}
                  onEditSubmit={onEditSubmit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

