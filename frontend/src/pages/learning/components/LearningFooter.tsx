import React from 'react';
import { Button, theme } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import type { ClassroomLesson } from '../../../types/enrollment.types';

interface LearningFooterProps {
  prevLesson: ClassroomLesson | null;
  nextLesson: ClassroomLesson | null;
  onSelectLesson: (lesson: ClassroomLesson) => void;
}

export const LearningFooter: React.FC<LearningFooterProps> = ({
  prevLesson,
  nextLesson,
  onSelectLesson,
}) => {
  const { token } = theme.useToken();

  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: `1px solid ${token.colorBorder}`,
        backgroundColor: token.colorBgContainer, // #ffffff
        padding: '16px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        bottom: 0,
        zIndex: 90,
        boxShadow: '0 -1px 3px 0 rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Previous Lesson */}
      {prevLesson ? (
        <Button
          icon={<LeftOutlined />}
          onClick={() => onSelectLesson(prevLesson)}
          style={{
            borderRadius: 4,
            backgroundColor: token.colorBgContainer,
            borderColor: token.colorBorder,
            color: token.colorText,
            fontWeight: 600,
            boxShadow: '1px 1px 0px 0px #262626',
          }}
        >
          Previous Lesson
        </Button>
      ) : (
        <div />
      )}

      {/* Next Lesson / Finished CTA */}
      {nextLesson ? (
        <Button
          type="primary"
          icon={<RightOutlined />}
          onClick={() => onSelectLesson(nextLesson)}
          style={{
            borderRadius: 4,
            backgroundColor: token.colorPrimary, // #a3e635
            color: token.colorText, // #262626
            border: `1px solid ${token.colorText}`,
            fontWeight: 700,
            boxShadow: 'var(--shadow-hard)',
            height: 40,
            padding: '0 20px',
          }}
        >
          Next: {nextLesson.title}
        </Button>
      ) : (
        <Button
          type="primary"
          icon={<TrophyOutlined />}
          style={{
            borderRadius: 4,
            backgroundColor: token.colorPrimary,
            color: token.colorText,
            border: `1px solid ${token.colorText}`,
            fontWeight: 700,
            boxShadow: 'var(--shadow-hard)',
            height: 40,
            padding: '0 20px',
          }}
        >
          Curriculum Complete!
        </Button>
      )}
    </footer>
  );
};
