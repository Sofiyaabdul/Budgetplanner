import React from 'react';
import { Edit2, Trash2, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';

const TransactionTable = ({
  transactions = [],
  currency = '$',
  onEdit,
  onDelete,
  showActions = true,
  emptyMessage = 'No transactions recorded yet'
}) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Tag size={24} />
        </div>
        <p className="empty-state-title">{emptyMessage}</p>
        <p className="empty-state-desc">
          Add your first income or expense to start tracking your cash flow.
        </p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Category</th>
            <th>Date</th>
            <th>Method / Source</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
            {showActions && <th style={{ textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <tr key={tx._id || `${tx.title}-${tx.date}`}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isIncome ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                        color: isIncome ? 'var(--color-success)' : 'var(--color-danger)',
                        flexShrink: 0
                      }}
                    >
                      {isIncome ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {tx.title}
                      </div>
                      {tx.description && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            maxWidth: '220px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {tx.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge badge-neutral">{tx.category}</span>
                </td>
                <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                  {formatDate(tx.date)}
                </td>
                <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                  {tx.paymentMethod || tx.paymentSource || tx.methodOrSource || 'Standard'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span
                    className={`tabular-nums ${isIncome ? 'amount-income' : 'amount-expense'}`}
                  >
                    {isIncome ? '+' : '-'}
                    {currency}
                    {formatAmount(tx.amount)}
                  </span>
                </td>
                {showActions && (
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(tx)}
                          className="btn btn-ghost btn-icon"
                          title="Edit transaction"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(tx._id, tx.type)}
                          className="btn btn-danger-ghost btn-icon"
                          title="Delete transaction"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
