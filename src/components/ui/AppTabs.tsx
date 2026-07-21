import { Tabs } from "@heroui/react";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";

type AppTabProps = {
  id: string;
  label: ReactNode;
  children: ReactNode;
};

export function AppTab(props: AppTabProps) {
  void props;
  return null;
}

type AppTabsProps = {
  children: ReactNode;
  selectedKey: string;
  onSelectionChange: (key: string) => void;
  "aria-label": string;
  className?: string;
  listClassName?: string;
  tabClassName?: string;
  panelClassName?: string;
  indicatorClassName?: string;
};

export default function AppTabs({
  children,
  selectedKey,
  onSelectionChange,
  "aria-label": ariaLabel,
  className,
  listClassName,
  tabClassName,
  panelClassName,
  indicatorClassName,
}: AppTabsProps) {
  const tabs = Children.toArray(children).filter(
    (child): child is ReactElement<AppTabProps> => isValidElement(child),
  );

  return (
    <Tabs
      selectedKey={selectedKey}
      onSelectionChange={(key) => onSelectionChange(String(key))}
      className={className}
      variant="secondary"
    >
      <Tabs.ListContainer>
        <Tabs.List aria-label={ariaLabel} className={listClassName}>
          {tabs.map((tab) => (
            <Tabs.Tab key={tab.props.id} id={tab.props.id} className={tabClassName}>
              {tab.props.label}
              <Tabs.Indicator className={indicatorClassName} />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
      {tabs.map((tab) => (
        <Tabs.Panel
          key={tab.props.id}
          id={tab.props.id}
          className={panelClassName}
        >
          {tab.props.children}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
