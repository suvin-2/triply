import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { logError } from "../../utils/logger";
import styles from "./ErrorBoundary.module.scss";

interface Props {
  /** 에러가 없을 때 렌더링할 자식 컴포넌트 */
  children: ReactNode;
  /** 에러 발생 시 대신 렌더링할 UI. 생략 시 기본 에러 메시지를 표시한다. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * React 렌더 트리의 복구 불가능한 런타임 에러를 잡는 에러 경계.
 *
 * 주의: 이벤트 핸들러·비동기(Firebase) 에러는 잡지 않는다.
 * 해당 에러는 각 훅의 try/catch에서 처리한다.
 *
 * 사용 예:
 * ```tsx
 * <ErrorBoundary fallback={<p>문제가 발생했어요. 새로고침해 주세요.</p>}>
 *   <ChildComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logError("[ErrorBoundary]", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div role="alert" className={styles.fallback}>
            <p>문제가 발생했어요.</p>
            <p>페이지를 새로고침해 주세요.</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
