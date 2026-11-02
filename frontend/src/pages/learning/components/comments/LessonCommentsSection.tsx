import React, { useState, useEffect, useCallback } from 'react';
import { App, Button, Empty, Skeleton, Space, Tag, Typography, theme } from 'antd';
import { CommentOutlined, DownOutlined } from '@ant-design/icons';
import { useAuth } from '../../../../context/useAuth';
import {
  getLessonCommentsApi,
  createLessonCommentApi,
  updateCommentApi,
  deleteCommentApi,
} from '../../../../api/comment.api';
import type { LessonCommentItem } from '../../../../types/comment.types';
import { CommentComposer } from './CommentComposer';
import { CommentItem } from './CommentItem';

const { Title, Text } = Typography;

export interface LessonCommentsSectionProps {
  lessonId: string;
}

const PAGE_LIMIT = 15;

export const LessonCommentsSection: React.FC<LessonCommentsSectionProps> = ({
  lessonId,
}) => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const { user } = useAuth();

  const [comments, setComments] = useState<LessonCommentItem[]>([]);
  const [totalComments, setTotalComments] = useState<number>(0);
  const [courseLecturerId, setCourseLecturerId] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [postingRoot, setPostingRoot] = useState<boolean>(false);

  // 1. Fetch comments for current lesson
  const fetchComments = useCallback(
    async (targetPage: number, append: boolean = false) => {
      if (!lessonId) return;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await getLessonCommentsApi(lessonId, targetPage, PAGE_LIMIT);
        if (res.success && res.data) {
          const { items, total_comments, course_lecturer_id } = res.data;
          setComments((prev) => (append ? [...prev, ...items] : items));
          setTotalComments(total_comments);
          setCourseLecturerId(course_lecturer_id);
          setPage(res.pagination?.page ?? targetPage);
          setTotalPages(res.pagination?.totalPages ?? 1);
        }
      } catch {
        message.error('Failed to load lesson discussions');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [lessonId, message]
  );

  // Reset & reload whenever lessonId changes
  useEffect(() => {
    let ignore = false;
    setComments([]);
    setTotalComments(0);
    setPage(1);
    setTotalPages(1);

    const run = async () => {
      await Promise.resolve();
      if (!ignore) {
        await fetchComments(1, false);
      }
    };
    void run();

    return () => {
      ignore = true;
    };
  }, [fetchComments]);

  // 2. Post a new root comment
  const handleCreateRootComment = async (content: string): Promise<boolean> => {
    setPostingRoot(true);
    try {
      const res = await createLessonCommentApi(lessonId, { content });
      if (res.success && res.data) {
        const newComment = res.data;
        setComments((prev) => [newComment, ...prev]);
        setTotalComments((prev) => prev + 1);
        message.success('Comment posted');
        return true;
      }
      return false;
    } catch {
      message.error('Failed to post comment');
      return false;
    } finally {
      setPostingRoot(false);
    }
  };

  // 3. Post a reply to a root comment
  const handleCreateReply = async (
    parentCommentId: string,
    content: string
  ): Promise<boolean> => {
    try {
      const res = await createLessonCommentApi(lessonId, {
        content,
        parent_comment_id: parentCommentId,
      });

      if (res.success && res.data) {
        const newReply = res.data;
        setComments((prev) =>
          prev.map((rootItem) =>
            rootItem.id === parentCommentId
              ? {
                  ...rootItem,
                  replies: [...(rootItem.replies || []), newReply],
                }
              : rootItem
          )
        );
        setTotalComments((prev) => prev + 1);
        message.success('Reply posted');
        return true;
      }
      return false;
    } catch {
      message.error('Failed to post reply');
      return false;
    }
  };

  // 4. Edit an existing comment (root or reply)
  const handleEditComment = async (
    commentId: string,
    content: string
  ): Promise<boolean> => {
    try {
      const res = await updateCommentApi(commentId, { content });
      if (res.success && res.data) {
        const updated = res.data;
        setComments((prev) =>
          prev.map((rootItem) => {
            if (rootItem.id === commentId) {
              return {
                ...rootItem,
                content: updated.content,
                updated_at: updated.updated_at,
              };
            }
            if (rootItem.replies && rootItem.replies.length > 0) {
              return {
                ...rootItem,
                replies: rootItem.replies.map((reply) =>
                  reply.id === commentId
                    ? {
                        ...reply,
                        content: updated.content,
                        updated_at: updated.updated_at,
                      }
                    : reply
                ),
              };
            }
            return rootItem;
          })
        );
        message.success('Comment updated');
        return true;
      }
      return false;
    } catch {
      message.error('Failed to update comment');
      return false;
    }
  };

  // 5. Delete a comment (root or reply)
  const handleDeleteComment = async (commentId: string): Promise<void> => {
    try {
      const res = await deleteCommentApi(commentId);
      if (res.success) {
        setComments((prev) => {
          // Check if it's a root comment
          const targetRoot = prev.find((item) => item.id === commentId);
          if (targetRoot) {
            const removedCount = 1 + (targetRoot.replies?.length || 0);
            setTotalComments((count) => Math.max(0, count - removedCount));
            return prev.filter((item) => item.id !== commentId);
          }

          // Otherwise it's a reply
          setTotalComments((count) => Math.max(0, count - 1));
          return prev.map((rootItem) => ({
            ...rootItem,
            replies: (rootItem.replies || []).filter(
              (reply) => reply.id !== commentId
            ),
          }));
        });
        message.success('Comment deleted');
      }
    } catch {
      message.error('Failed to delete comment');
    }
  };

  return (
    <div
      style={{
        backgroundColor: token.colorBgContainer, // #ffffff (Paper White)
        padding: '28px 32px',
        borderRadius: 8,
        border: `1px solid ${token.colorBorder}`,
        boxShadow: '1px 1px 0px 0px #262626',
        marginTop: 28,
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 16,
          marginBottom: 20,
          borderBottom: `1px solid ${token.colorBorder}`,
        }}
      >
        <Space size={10} align="center">
          <CommentOutlined
            style={{
              fontSize: 20,
              color: token.colorText,
            }}
          />
          <Title
            level={4}
            style={{
              margin: 0,
              fontSize: 18,
              letterSpacing: -0.3,
              color: token.colorText,
            }}
          >
            Lesson Discussion & Q&A
          </Title>
          <Tag
            style={{
              margin: 0,
              borderRadius: 9999,
              fontWeight: 700,
              fontSize: 12,
              padding: '1px 10px',
              backgroundColor: '#f5f5f4',
              borderColor: token.colorBorder,
              color: token.colorText,
            }}
          >
            {totalComments}
          </Tag>
        </Space>

        <Text type="secondary" style={{ fontSize: 13 }}>
          Have a question about this lesson? Discuss with your instructor and peers.
        </Text>
      </div>

      {/* Root Comment Composer */}
      <div
        style={{
          paddingBottom: 22,
          borderBottom: `1px solid ${token.colorBorder}`,
        }}
      >
        <CommentComposer
          userAvatar={user?.avatar_url}
          userName={user?.full_name}
          placeholder="Ask a question, share a tip, or discuss key takeaways from this lesson..."
          submitLabel="Post Comment"
          submitting={postingRoot}
          onSubmit={handleCreateRootComment}
        />
      </div>

      {/* Comments List */}
      {loading ? (
        <div style={{ paddingTop: 24 }}>
          <Skeleton avatar active paragraph={{ rows: 2 }} />
          <Skeleton avatar active paragraph={{ rows: 2 }} style={{ marginTop: 16 }} />
        </div>
      ) : comments.length === 0 ? (
        <div style={{ padding: '36px 16px 20px 16px' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary" style={{ fontSize: 14 }}>
                No questions or comments for this lesson yet. Be the first to start the discussion!
              </Text>
            }
          />
        </div>
      ) : (
        <div>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              currentUserRole={user?.role}
              currentUserAvatar={user?.avatar_url}
              currentUserName={user?.full_name}
              courseLecturerId={courseLecturerId}
              onReplySubmit={handleCreateReply}
              onEditSubmit={handleEditComment}
              onDelete={handleDeleteComment}
            />
          ))}

          {/* Load More Pagination */}
          {page < totalPages && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Button
                icon={<DownOutlined />}
                loading={loadingMore}
                onClick={() => void fetchComments(page + 1, true)}
                style={{
                  borderRadius: 4,
                  fontWeight: 600,
                  borderColor: token.colorText,
                  color: token.colorText,
                  boxShadow: '1px 1px 0px 0px #262626',
                }}
              >
                Load More Discussions
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

