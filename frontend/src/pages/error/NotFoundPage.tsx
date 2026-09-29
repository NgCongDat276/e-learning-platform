import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Result } from 'antd';

export const NotFoundPage: React.FC = () => {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist or has been moved."
        extra={
          <Link to="/">
            <Button type="primary" size="large">
              Back to Home
            </Button>
          </Link>
        }
      />
    </div>
  );
};
