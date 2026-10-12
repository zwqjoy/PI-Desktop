import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui";
import { useAppStore } from "../../stores/app-store";

export function WorkspaceHubNav() {
  const { t } = useTranslation();
  const page = useAppStore((state) => state.page);
  const setPage = useAppStore((state) => state.setPage);
  return (
    <nav className="hub-navigation" aria-label={t("workspaceHub.navigation")}>
      {(["dashboard", "library"] as const).map((target) => (
        <Button
          key={target}
          className={page === target ? "active" : ""}
          variant="ghost"
          aria-current={page === target ? "page" : undefined}
          onClick={() => setPage(target)}
        >
          {t(`workspaceHub.${target}`)}
        </Button>
      ))}
    </nav>
  );
}
