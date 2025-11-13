import PropTypes from 'prop-types';
import classNames from 'classnames';
import './StatusBadge.css';

const StatusBadge = ({ status }) => (
  <span className={classNames('badge', `badge--${status?.toLowerCase().replace(/\s+/g, '-') || 'default'}`)}>
    {status}
  </span>
);

StatusBadge.propTypes = {
  status: PropTypes.string,
};

StatusBadge.defaultProps = {
  status: 'Pending',
};

export default StatusBadge;
