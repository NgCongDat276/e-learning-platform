import React, { useRef } from "react";
import { Typography, theme } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import type { ClassroomLesson } from "../../../types/enrollment.types";

const { Title, Text } = Typography;

interface VideoPlayerProps {
  lesson: ClassroomLesson;
  onEnded: () => void;
  onSaveProgress: (position: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  lesson,
  onEnded,
  onSaveProgress,
}) => {
  const { token } = theme.useToken();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedTimeRef = useRef<number>(0);

  // Khi tải xong metadata của video: tua tới last_watched_position
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const pos = lesson.last_watched_position || 0;
    if (pos > 0 && pos < videoRef.current.duration) {
      videoRef.current.currentTime = pos;
      lastSavedTimeRef.current = pos;
    }
  };

  // Throttle: Gọi API lưu vị trí xem định kỳ mỗi 15 giây
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    if (Math.abs(currentTime - lastSavedTimeRef.current) >= 15) {
      lastSavedTimeRef.current = currentTime;
      onSaveProgress(Math.floor(currentTime));
    }
  };

  // Lưu ngay khi người dùng tạm dừng video
  const handlePause = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    lastSavedTimeRef.current = currentTime;
    onSaveProgress(Math.floor(currentTime));
  };

  if (!lesson.content_url) {
    return (
      <div
        style={{
          width: "100%",
          backgroundColor: "#000000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "75vh",
          minHeight: "75vh",
          padding: "24px",
          color: "#a3a3a3",
        }}
      >
        <PlayCircleOutlined
          style={{ fontSize: 52, color: "#525252", marginBottom: 16 }}
        />
        <Title level={4} style={{ color: "#d4d4d4", margin: "0 0 8px 0" }}>
          Video Media Not Attached
        </Title>
        <Text style={{ color: "#737373", fontSize: 13 }}>
          The instructor has not uploaded a video file for this lesson yet.
        </Text>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#000000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "70vh", // Chiếm đúng 75% viewport height
        minHeight: "750px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <video
        ref={videoRef}
        key={lesson.id}
        controls
        controlsList="nodownload"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPause={handlePause}
        onEnded={onEnded}
        style={{
          width: "100%",
          height: "100%",
          maxHeight: "75vh",
          objectFit: "contain", // Tự động căn theo chiều dài 75vh, phần thừa là khoảng đen
          backgroundColor: "#000000",
          outline: "none",
          display: "block",
        }}
      >
        <source src={lesson.content_url} />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};
