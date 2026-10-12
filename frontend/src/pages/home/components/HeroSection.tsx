import React from 'react';
import { Button, Typography, Space, Tag, theme } from 'antd';
import { Link } from 'react-router-dom';
import {
  RocketOutlined,
  SolutionOutlined,
  StarFilled,
  CheckCircleFilled,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export const HeroSection: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <section
      style={{
        padding: '72px 24px 56px 24px',
        maxWidth: 1200,
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      {/* Kicker badge */}
      <div style={{ marginBottom: 20 }}>
        <Tag
          style={{
            borderRadius: 9999,
            backgroundColor: '#dcfff1',
            borderColor: '#7ee2b8',
            color: '#262626',
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          ✦ The Editorial Broadsheet System · 2026 Edition
        </Tag>
      </div>

      {/* Headline */}
      <Title
        level={1}
        style={{
          fontSize: 'clamp(36px, 5.5vw, 60px)',
          lineHeight: 1.12,
          marginBottom: 20,
          letterSpacing: -1.5,
          fontWeight: 800,
          maxWidth: 960,
          margin: '0 auto 20px',
        }}
      >
        A Practical & Focused{' '}
        <span className="font-editorial" style={{ fontStyle: 'italic', fontWeight: 600 }}>
          Learning Platform
        </span>{' '}
        for Students
      </Title>

      {/* Subtitle */}
      <Paragraph
        style={{
          fontSize: 'clamp(16px, 2vw, 19px)',
          color: token.colorTextSecondary,
          maxWidth: 760,
          margin: '0 auto 36px',
          lineHeight: 1.6,
        }}
      >
        Built for engineers who demand depth over trivia. Complete end-to-end production systems,
        interactive chapter diagnostic assessments, and verified instructor masterclasses.
      </Paragraph>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Link to="/courses">
          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            style={{
              height: 48,
              padding: '0 32px',
              fontWeight: 600,
              fontSize: 15,
              boxShadow: 'var(--shadow-hard)',
            }}
          >
            Explore Course Catalog
          </Button>
        </Link>
        <a href="#teach-with-us">
          <Button
            size="large"
            icon={<SolutionOutlined />}
            style={{
              height: 48,
              padding: '0 28px',
              fontWeight: 600,
              fontSize: 15,
              backgroundColor: token.colorBgContainer,
            }}
          >
            Teach on Edutech
          </Button>
        </a>
      </div>

      {/* Social Proof Strip */}
      <div
        style={{
          marginTop: 48,
          paddingTop: 32,
          borderTop: `1px solid ${token.colorBorder}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '32px 48px',
          color: token.colorTextSecondary,
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <Space size={8}>
          <StarFilled style={{ color: '#eab308', fontSize: 16 }} />
          <span>
            <strong>4.9/5</strong> Rating from 3,800+ Engineers
          </span>
        </Space>
        <Space size={8}>
          <CheckCircleFilled style={{ color: token.colorSuccess, fontSize: 16 }} />
          <span>
            <strong>98.4%</strong> Chapter Assessment Pass Rate
          </span>
        </Space>
        <Space size={8}>
          <SafetyCertificateOutlined style={{ color: '#2563eb', fontSize: 16 }} />
          <span>
            <strong>100%</strong> Vetted & Verified Instructors
          </span>
        </Space>
      </div>
    </section>
  );
};
