import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/Card';
import { Calculator, Info, Wallet, TrendingUp, ChevronRight, PieChart } from 'lucide-react';
import { Button } from '../shared/ui/Button';

interface PropertyMortgageProps {
  price: number;
}

export function PropertyMortgage({ price }: PropertyMortgageProps) {
  const [loanAmount, setLoanAmount] = useState(price * 0.7);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTerm, setLoanTerm] = useState(20);
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  useEffect(() => {
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    const payment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    setMonthlyPayment(payment);
  }, [loanAmount, interestRate, loanTerm]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)} tỷ`;
    }
    return `${amount.toFixed(0)} triệu`;
  };

  return (
    <Card className="border-gray-50 shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          Tính toán tài chính
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Số tiền vay (70%)</span>
                  <span className="font-bold text-blue-600">{formatCurrency(loanAmount)}</span>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={price} 
                  step={100}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Lãi suất năm (%)</span>
                  <span className="font-bold text-blue-600">{interestRate}%</span>
                </div>
                <input 
                  type="range" 
                  min={5} 
                  max={15} 
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Thời hạn vay (năm)</span>
                  <span className="font-bold text-blue-600">{loanTerm} năm</span>
                </div>
                <input 
                  type="range" 
                  min={5} 
                  max={35} 
                  step={1}
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Number(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm text-blue-600 font-bold uppercase tracking-wider mb-2">Góp hàng tháng</p>
                <h3 className="text-4xl font-bold text-blue-900">{monthlyPayment.toFixed(1)} triệu</h3>
                <p className="text-xs text-blue-600/60 mt-1">Ước tính (Gốc + Lãi)</p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Wallet className="w-3 h-3" /> Vốn tự có (30%)
              </div>
              <p className="font-bold text-gray-900">{formatCurrency(price - loanAmount)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <PieChart className="w-3 h-3" /> Tổng lãi phải trả
              </div>
              <p className="font-bold text-gray-900">{formatCurrency(monthlyPayment * loanTerm * 12 - loanAmount)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <TrendingUp className="w-3 h-3" /> Tổng thanh toán
              </div>
              <p className="font-bold text-gray-900">{formatCurrency(monthlyPayment * loanTerm * 12)}</p>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs text-indigo-900 leading-relaxed">
                Hệ thống <strong>AI Finance</strong> gợi ý: Bạn nên có thu nhập hàng tháng tối thiểu <strong>{(monthlyPayment * 2.5).toFixed(0)} triệu</strong> để đảm bảo an toàn tài chính khi mua bất động sản này.
              </p>
              <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1 hover:underline">
                Xem chi tiết lộ trình trả nợ <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100">
            Nhận tư vấn vay từ đối tác ngân hàng (VIB, Techcombank, VPBank)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
