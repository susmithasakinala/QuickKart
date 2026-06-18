import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export const RevenueChart = ({ labels, values }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Revenue (₹)',
          data: values || [12000, 19000, 32000, 15000, 24000, 45000],
          borderColor: '#FF6B00',
          backgroundColor: 'rgba(255, 107, 0, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { grid: { color: '#f0f0f0' } },
          x: { grid: { display: false } }
        }
      }
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [labels, values]);

  return (
    <div style={{ height: '240px', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export const SalesChart = ({ labels, values }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels || ['Fashion', 'Beauty', 'Electronics', 'Sports', 'Grocery'],
        datasets: [{
          label: 'Sales count',
          data: values || [12, 19, 32, 5, 24],
          backgroundColor: '#2E7D32',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { grid: { color: '#f0f0f0' } },
          x: { grid: { display: false } }
        }
      }
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [labels, values]);

  return (
    <div style={{ height: '240px', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export const CategoryPieChart = ({ labels, values }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels || ['Fashion', 'Beauty', 'Electronics', 'Sports', 'Grocery'],
        datasets: [{
          data: values || [15, 10, 25, 8, 12],
          backgroundColor: ['#2E7D32', '#FF6B00', '#222222', '#0288d1', '#7b1fa2'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { family: 'Outfit' } }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [labels, values]);

  return (
    <div style={{ height: '240px', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};
