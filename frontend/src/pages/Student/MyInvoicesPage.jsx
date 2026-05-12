import { useEffect, useState } from 'react';
import { getMyPayments, downloadInvoice } from '../../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  FaFileInvoice, FaDownload, FaExternalLinkAlt,
  FaCheckCircle, FaSpinner, FaReceipt,
} from 'react-icons/fa';
import { SiStripe } from 'react-icons/si';

const MyInvoicesPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    getMyPayments()
      .then((res) => setPayments(res.data.data || []))
      .catch(() => toast.error('Failed to load invoices'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (payment) => {
    setDownloading(payment._id);
    try {
      const res  = await downloadInvoice(payment._id);
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `${payment.invoiceNumber || 'invoice'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded!');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <FaSpinner className="animate-spin text-green-500 text-4xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Billing & Invoices</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage your purchase history and receipts</p>
        </div>
      </div>

      {payments.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Spent</p>
            <p className="text-3xl font-black text-slate-900">
              ₹{payments.reduce((acc, p) => acc + (p.amountPaid || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Transactions</p>
            <p className="text-3xl font-black text-slate-900">{payments.length}</p>
          </div>
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Payment Method</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-xl"><SiStripe /></div>
              <p className="text-lg font-black text-slate-900">Stripe</p>
            </div>
          </div>
        </motion.div>
      )}

      {payments.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-100">
            <FaReceipt className="text-5xl text-slate-300" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800">No billing history</h3>
          <p className="text-slate-500 mt-2 font-medium max-w-sm">
            Once you enroll in a premium course, your invoices will appear here automatically.
          </p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <th className="py-5 px-6 whitespace-nowrap">Invoice & Date</th>
                  <th className="py-5 px-6 whitespace-nowrap">Course</th>
                  <th className="py-5 px-6 whitespace-nowrap">Status</th>
                  <th className="py-5 px-6 whitespace-nowrap text-right">Amount</th>
                  <th className="py-5 px-6 whitespace-nowrap text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map((p, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * idx }}
                    key={p._id} className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="py-4 px-6 align-middle">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{p.invoiceNumber || 'INV-PENDING'}</span>
                        <span className="text-xs text-slate-500 font-medium">{formatDate(p.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                          {p.course?.thumbnailUrl ? (
                            <img src={p.course.thumbnailUrl} alt={p.course?.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><FaFileInvoice className="text-slate-300" /></div>
                          )}
                        </div>
                        <span className="font-bold text-slate-800 text-sm max-w-[200px] truncate">{p.course?.title || 'Unknown Course'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 align-middle">
                      <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-green-100">
                        <FaCheckCircle className="text-green-500" /> Paid
                      </div>
                    </td>
                    <td className="py-4 px-6 align-middle text-right">
                      <span className="font-black text-slate-900">₹{p.amountPaid?.toLocaleString() || '0'}</span>
                    </td>
                    <td className="py-4 px-6 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        {p.receiptUrl && (
                          <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center transition-colors shadow-sm" title="View Stripe Receipt">
                            <FaExternalLinkAlt className="text-xs" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDownload(p)}
                          disabled={downloading === p._id}
                          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-md disabled:opacity-50"
                        >
                          {downloading === p._id ? <FaSpinner className="animate-spin" /> : <FaDownload />} PDF
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MyInvoicesPage;
