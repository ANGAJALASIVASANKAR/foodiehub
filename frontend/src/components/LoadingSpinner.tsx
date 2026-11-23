interface Props {
  label?: string;
  inline?: boolean;
}

export default function LoadingSpinner({ label = 'Loading...', inline = false }: Props) {
  return (
    <div className={inline ? 'spinner-inline' : 'spinner-block'} role="status" aria-label={label}>
      <span className="spinner" aria-hidden="true" />
      <span className="spinner__label">{label}</span>
    </div>
  );
}
