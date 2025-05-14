import { useEffect } from 'react';
import { Helmet } from 'react-helmet';

interface FrameMetadataProps {
  submissionId?: string;
  dareText?: string;
  imageUrl?: string;
  streakCount?: number;
}

export function FrameMetadata({ submissionId, dareText, imageUrl, streakCount }: FrameMetadataProps) {
  useEffect(() => {
    // Update frame metadata when props change
    const frameData = {
      version: 'vNext',
      image: imageUrl,
      buttons: [
        {
          label: 'Open in Fuse',
          action: 'link',
          target: `${window.location.origin}?submission=${submissionId}`
        }
      ],
      postUrl: `${window.location.origin}/api/frame`,
      input: {
        text: `Completed dare: "${dareText}" with a ${streakCount} day streak!`
      }
    };

    // Update meta tag
    const metaTag = document.querySelector('meta[name="fc:frame"]');
    if (metaTag) {
      metaTag.setAttribute('content', JSON.stringify(frameData));
    } else {
      const newMetaTag = document.createElement('meta');
      newMetaTag.setAttribute('name', 'fc:frame');
      newMetaTag.setAttribute('content', JSON.stringify(frameData));
      document.head.appendChild(newMetaTag);
    }
  }, [submissionId, dareText, imageUrl, streakCount]);

  return null;
} 