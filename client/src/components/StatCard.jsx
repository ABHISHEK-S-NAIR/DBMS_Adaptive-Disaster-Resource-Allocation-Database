import PropTypes from 'prop-types';
import './StatCard.css';

const StatCard = ({ label, value, accent }) => (
  <div className="stat-card" style={{ borderTopColor: accent }}>
    <p className="stat-card__label">{label}</p>
    <p className="stat-card__value">{value}</p>
  </div>
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  accent: PropTypes.string,
};

StatCard.defaultProps = {
  accent: '#2563eb',
};

export default StatCard;
