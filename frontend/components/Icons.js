// Small inline icon set (stroke icons, 24px grid) so we don't pull in an icon library.
const Icon = ({ children, size = 18, className = "", ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} {...rest}>
    {children}
  </svg>
);

export const HeartIcon = ({ filled, ...p }) => (
  <Icon {...p}>
    <path fill={filled ? "currentColor" : "none"} d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </Icon>
);
export const CommentIcon = (p) => (
  <Icon {...p}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></Icon>
);
export const SearchIcon = (p) => (
  <Icon {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon>
);
export const PlusIcon = (p) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
);
export const CloseIcon = (p) => (
  <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>
);
export const SendIcon = (p) => (
  <Icon {...p}><path d="M14.5 21.7a.5.5 0 0 0 .9 0L22 2.6a.5.5 0 0 0-.6-.6L2.3 8.6a.5.5 0 0 0 0 .9l7.9 3.2a2 2 0 0 1 1.1 1.1Z" /><path d="m21.9 2.1-10.9 10.9" /></Icon>
);
export const SparkIcon = (p) => (
  <Icon {...p}><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2Z" /><path d="M19 3v4M17 5h4" /></Icon>
);
export const TrashIcon = (p) => (
  <Icon {...p}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Icon>
);
export const ArrowIcon = (p) => (
  <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
);
export const LogoutIcon = (p) => (
  <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Icon>
);
