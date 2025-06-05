const Widget = ({ title, children }) => {
  return (
    <div className="widget">
      <div className="widget-header">
        <h3>{title}</h3>
      </div>
      <div className="widget-content">
        {children}
      </div>
    </div>
  );
};

export default Widget;