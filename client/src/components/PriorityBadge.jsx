import PropTypes from 'prop-types';
import classNames from 'classnames';
import './PriorityBadge.css';

const PriorityBadge = ({ priority }) => (
  <span className={classNames('priority', `priority--${priority?.toLowerCase() || 'low'}`)}>{priority}</span>
);

PriorityBadge.propTypes = {
  priority: PropTypes.string,
};

PriorityBadge.defaultProps = {
  priority: 'Low',
};

export default PriorityBadge;
