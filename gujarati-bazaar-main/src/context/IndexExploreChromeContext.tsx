import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

/** True while the Explore Products section is the active vertical slice (navbar hidden; category pills are top chrome). */
type Value = {
  exploreChromeActive: boolean;
  setExploreChromeActive: Dispatch<SetStateAction<boolean>>;
};

const IndexExploreChromeContext = createContext<Value | null>(null);

export function IndexExploreChromeProvider({ children }: { children: ReactNode }) {
  const [exploreChromeActive, setExploreChromeActive] = useState(false);
  const value = useMemo(
    () => ({ exploreChromeActive, setExploreChromeActive }),
    [exploreChromeActive],
  );
  return (
    <IndexExploreChromeContext.Provider value={value}>{children}</IndexExploreChromeContext.Provider>
  );
}

export function useIndexExploreChrome() {
  return useContext(IndexExploreChromeContext);
}
