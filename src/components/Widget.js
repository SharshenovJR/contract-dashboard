const Widget = ({ title, children, headerActions }) => {
  return (
    <div className="widget">
      <div className="widget-header">
        <h3>{title}</h3>
        {headerActions && <div className="widget-header-actions">{headerActions}</div>}
      </div>
      <div className="widget-content">
        {children}
      </div>
    </div>
  );
};

export default Widget;