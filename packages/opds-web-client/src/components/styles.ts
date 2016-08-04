export const visuallyHiddenStyle: __React.CSSProperties = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  width: "1px",
};

export const subtleListStyle: __React.CSSProperties = {
  padding: 0,
  margin: 0,
  listStyleType: "none"
};

export function popupStyle(width: number, height: number = 200): __React.CSSProperties {
  return {
    position: "fixed",
    top: "50%",
    left: "50%",
    width: `${width}px`,
    marginTop: `-${height / 2}px`,
    marginLeft: `-${width / 2}px`,
    padding: "30px",
    backgroundColor: "#ddd",
    textAlign: "center",
    fontFamily: "Arial, Helvetica, sans-serif",
    zIndex: 200,
    borderRadius: "20px",
    boxShadow: "0 0 1em #888"
  };
}