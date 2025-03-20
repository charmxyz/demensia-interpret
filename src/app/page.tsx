'use client';

import { useState } from 'react';

type BloodTest = {
  name: string;
  positiveLR: number;
  negativeLR: number;
  threshold: number;
};

const BLOOD_TESTS: BloodTest[] = [
  { name: 'Neurofilament Light (NfL)', positiveLR: 2.5, negativeLR: 0.5, threshold: 20 },
  { name: 'Glial Fibrillary Acidic Protein (GFAP)', positiveLR: 5, negativeLR: 0.1, threshold: 15 },
  { name: 'Phosphorylated Tau 217 (pTau 217)', positiveLR: 9.3, negativeLR: 0.46, threshold: 10 },
  { name: 'Amyloid PET Scan', positiveLR: 12, negativeLR: 0.2, threshold: 5 },
];

function RecommendationText({ testName, isRecommended }: { testName: string; isRecommended: boolean }) {
  if (isRecommended) {
    return <span>{testName} is recommended as it could significantly impact the diagnosis.</span>;
  }
  return <span>{testName} could provide additional information but is not strongly recommended.</span>;
}

export default function DementiaRiskCalculator() {
  const [initialRisk, setInitialRisk] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [result, setResult] = useState<{ recommendation: string; details: string } | null>(null);

  const getBaselineRisk = (age: number): number => {
    if (age < 60) return 3;
    if (age >= 60 && age <= 65) return 10;
    if (age >= 66 && age <= 70) return 15;
    if (age >= 71 && age <= 75) return 25;
    if (age >= 76 && age <= 80) return 35;
    if (age >= 81 && age <= 85) return 50;
    return 65; // Age > 85
  };

  const calculatePostTestProbability = (preTestProb: number, likelihoodRatio: number): number => {
    const preTestOdds = preTestProb / (1 - preTestProb);
    const postTestOdds = preTestOdds * likelihoodRatio;
    return postTestOdds / (1 + postTestOdds);
  };

  const calculateRisk = () => {
    const risk = parseFloat(initialRisk) / 100; // Convert to decimal
    const patientAge = parseInt(age);

    if (isNaN(risk) || isNaN(patientAge)) {
      setResult({
        recommendation: 'Please enter valid numbers for both fields.',
        details: ''
      });
      return;
    }

    if (!selectedTest) {
      setResult({
        recommendation: 'Please select a dementia test to proceed.',
        details: ''
      });
      return;
    }

    // Get baseline risk and adjust if necessary
    const baselineRisk = getBaselineRisk(patientAge) / 100; // Convert to decimal
    const adjustedRisk = Math.max(risk, baselineRisk);

    // Find selected test
    const test = BLOOD_TESTS.find(t => t.name === selectedTest);
    if (!test) {
      setResult({
        recommendation: 'Error: Selected test not found.',
        details: ''
      });
      return;
    }

    // Format results
    const formatPercentage = (value: number) => (value * 100).toFixed(1);
    
    // Check if pre-test probability is below threshold
    if (adjustedRisk * 100 < test.threshold) {
      setResult({
        recommendation: '[NOT RECOMMENDED] ' + test.name,
        details: `Patient Age: ${patientAge}\n` +
                `Baseline Risk: ${formatPercentage(baselineRisk)}%\n` +
                `Doctor&apos;s Estimated Probability: ${formatPercentage(risk)}%\n` +
                `Adjusted Pre-Test Probability: ${formatPercentage(adjustedRisk)}%\n\n` +
                `Selected Test: ${test.name}\n` +
                `Test Threshold: ${test.threshold}%\n` +
                `Pre-test probability (${formatPercentage(adjustedRisk)}%) is below the threshold of ${test.threshold}%`
      });
      return;
    }

    // Calculate post-test probabilities
    const positiveProb = calculatePostTestProbability(adjustedRisk, test.positiveLR);
    const negativeProb = calculatePostTestProbability(adjustedRisk, test.negativeLR);
    const probabilityGap = Math.abs(positiveProb - negativeProb);

    // Determine recommendation
    let recommendation = '';
    if (probabilityGap > 0.3) {
      recommendation = '[RECOMMENDED] ' + test.name;
    } else {
      recommendation = '[NOT RECOMMENDED] ' + test.name;
    }

    // Format details
    let details = `Patient Age: ${patientAge}\n`;
    details += `Baseline Risk: ${formatPercentage(baselineRisk)}%\n`;
    details += `Doctor&apos;s Estimated Probability: ${formatPercentage(risk)}%\n`;
    details += `Adjusted Pre-Test Probability: ${formatPercentage(adjustedRisk)}%\n\n`;
    
    details += `Selected Test: ${test.name}\n`;
    details += `Test Threshold: ${test.threshold}%\n`;
    details += `Likelihood Ratios: LR+ = ${test.positiveLR}, LR− = ${test.negativeLR}\n\n`;
    
    details += `Post-Test Probabilities:\n`;
    details += `- If Positive: ${formatPercentage(positiveProb)}%\n`;
    details += `- If Negative: ${formatPercentage(negativeProb)}%\n`;
    details += `- Probability Gap: ${formatPercentage(probabilityGap)}%`;

    setResult({ recommendation, details });
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dementia Risk Calculator</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label htmlFor="initialRisk" className="block text-sm font-medium text-gray-700 mb-2">
              Doctor&apos;s Estimated Dementia Probability (%)
            </label>
            <input
              type="number"
              id="initialRisk"
              value={initialRisk}
              onChange={(e) => setInitialRisk(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Enter initial probability percentage"
            />
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Patient&apos;s Age
            </label>
            <input
              type="number"
              id="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Enter patient&apos;s age"
            />
          </div>

          <div>
            <label htmlFor="bloodTest" className="block text-sm font-medium text-gray-700 mb-2">
              Dementia Test Selection
            </label>
            <select
              id="bloodTest"
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">Select a dementia test</option>
              {BLOOD_TESTS.map((test) => (
                <option key={test.name} value={test.name}>
                  {test.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={calculateRisk}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Calculate
          </button>

          {result && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                <h2 className="text-lg font-semibold text-blue-800 mb-2">Recommendation</h2>
                <p className="text-blue-700">
                  {result.recommendation}{' '}
                  <RecommendationText 
                    testName={selectedTest} 
                    isRecommended={result.recommendation.startsWith('[RECOMMENDED]')} 
                  />
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Details</h2>
                <pre className="text-gray-700 whitespace-pre-wrap font-sans">{result.details}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
