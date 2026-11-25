export default function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  variant = ""
}) {
  return (
    <div className={`summary-card ${variant}`}>
      <div className="summary-top">
        <span>{title}</span>
        {Icon && (
          <div className="summary-icon">
            <Icon size={21} />
          </div>
        )}
      </div>
      <h2>{value}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
