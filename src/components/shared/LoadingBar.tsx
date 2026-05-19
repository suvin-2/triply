import s from "./LoadingBar.module.scss";

type LoadingBarProps = {
  label?: string;
};

export function LoadingBar({
  label = "정보를 가져오고 있어요.",
}: LoadingBarProps) {
  return (
    <div className={s.wrap} role="status" aria-live="polite">
      <div className={s.loadingBar} aria-hidden="true">
        <div className={s.loadingBarFill} />
      </div>
      {label && <p className={s.label}>{label}</p>}
    </div>
  );
}
