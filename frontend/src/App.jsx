import React, { useState, useEffect } from "react";
import {
  Languages,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  Copy,
  Share,
} from "lucide-react";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("practice");
  const [sentence, setSentence] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [fullAnswer, setFullAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [accuracy, setAccuracy] = useState(null);
  const [similarSentences, setSimilarSentences] = useState([]);
  const [sentenceTip, setSentenceTip] = useState("");
  const [contextParagraph, setContextParagraph] = useState("");

  // Grammar tool states remain the same...
  const [englishInput, setEnglishInput] = useState("");
  const [refinedOutput, setRefinedOutput] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeTab === "practice") {
      fetchNewSentence();
    }
  }, [activeTab]);

  const fetchNewSentence = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sentence`);
      const data = await response.json();
      setSentence(data.sentence);
      setFullAnswer(data.fullAnswer);
      setShowAnswer(false);
      setUserInput("");
      setAccuracy(null);
      setSimilarSentences([]);
      setSentenceTip("");
      setContextParagraph("");
    } catch (error) {
      console.error("Error fetching sentence:", error);
    }
  };

  const checkAccuracy = async () => {
    if (!userInput.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/check-accuracy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput, correctAnswer: fullAnswer }),
      });
      const data = await response.json();
      setAccuracy(data.accuracy);

      // Only fetch similar sentences and tips if accuracy is below 90%
      if (data.accuracy < 90) {
        const similarResponse = await fetch(
          `${API_URL}/api/similar-sentences`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sentence: fullAnswer }),
          }
        );
        const similarData = await similarResponse.json();
        setSimilarSentences(similarData.similarSentences);
        setSentenceTip(similarData.tip);
        setContextParagraph(similarData.contextParagraph);
      }
    } catch (error) {
      console.error("Error checking accuracy:", error);
    }
  };

  const handleRefineGrammar = async () => {
    if (!englishInput.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/refine-grammar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: englishInput }),
      });
      const data = await response.json();
      setRefinedOutput(data.refinedText);
    } catch (error) {
      console.error("Grammar refinement error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(refinedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const shareOutput = async () => {
    try {
      await navigator.share({
        text: refinedOutput,
        title: "Refined Text",
      });
    } catch (err) {
      console.error("Failed to share:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Tab Navigation */}
        <div className="bg-gray-800 rounded-t-xl p-4 flex gap-4">
          <button
            onClick={() => setActiveTab("practice")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              activeTab === "practice"
                ? "bg-purple-900 text-purple-100"
                : "text-gray-300"
            }`}
          >
            <Languages className="w-5 h-5" />
            Practice Translations
          </button>
          <button
            onClick={() => setActiveTab("grammar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              activeTab === "grammar"
                ? "bg-purple-900 text-purple-100"
                : "text-gray-300"
            }`}
          >
            <Check className="w-5 h-5" />
            Refine English
          </button>
        </div>

        {/* Main Content Area */}
        <div className="bg-gray-800 shadow-xl rounded-b-xl p-6 md:p-8">
          {activeTab === "practice" && (
            <div className="space-y-6">
              {/* Sentence Display */}
              <div className="bg-gray-700 rounded-xl p-6 border-2 border-gray-600">
                <p className="text-sm text-purple-300 font-medium mb-2">
                  Translate this sentence:
                </p>
                <p className="text-lg md:text-xl font-medium text-gray-100">
                  {sentence}
                </p>
              </div>

              {/* Input and Actions */}
              <div className="space-y-4">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Enter your translation..."
                  className="w-full h-32 p-4 text-lg bg-gray-700 text-gray-100 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                />

                <div className="flex gap-4">
                  <button
                    onClick={checkAccuracy}
                    className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    Check Accuracy
                  </button>
                  <button
                    onClick={fetchNewSentence}
                    className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    Try Another
                  </button>
                </div>
              </div>

              {/* Accuracy Display */}
              {accuracy !== null && (
                <div
                  className={`rounded-xl p-4 border-2 ${
                    accuracy >= 90
                      ? "bg-green-900 border-green-700"
                      : "bg-yellow-900 border-yellow-700"
                  }`}
                >
                  <p className="text-white">Accuracy: {accuracy}%</p>
                </div>
              )}

              {/* Answer Toggle */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600"
                >
                  {showAnswer ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                  {showAnswer ? "Hide Answer" : "Show Answer"}
                </button>
              </div>

              {/* Answer Display */}
              {showAnswer && (
                <div className="bg-gray-700 rounded-xl p-4 border-2 border-gray-600">
                  <p className="text-gray-100">Answer: {fullAnswer}</p>
                </div>
              )}

              {accuracy !== null &&
                accuracy < 90 &&
                similarSentences.length > 0 && (
                  <div className="bg-gray-700 rounded-xl p-6 border-2 border-gray-600">
                    <div className="space-y-6">
                      {/* Similar Sentences Section */}
                      <div>
                        <h3 className="text-purple-300 font-medium mb-4">
                          Practice Examples:
                        </h3>
                        <ul className="space-y-2 text-gray-100">
                          {similarSentences.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-purple-300 min-w-[100px]">
                                {i === 0
                                  ? "Basic:"
                                  : i === 1
                                  ? "Intermediate:"
                                  : "Advanced:"}
                              </span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tip Section */}
                      {sentenceTip && (
                        <div className="border-t border-gray-600 pt-4">
                          <h3 className="text-purple-300 font-medium mb-2">
                            Learning Tip:
                          </h3>
                          <p className="text-gray-100">{sentenceTip}</p>
                        </div>
                      )}

                      {/* Context Paragraph Section */}
                      {contextParagraph && (
                        <div className="border-t border-gray-600 pt-4">
                          <h3 className="text-purple-300 font-medium mb-2">
                            Practical Context:
                          </h3>
                          <p className="text-gray-100 leading-relaxed">
                            {contextParagraph}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Grammar Tool */}
          {activeTab === "grammar" && (
            <div className="space-y-6">
              <textarea
                value={englishInput}
                onChange={(e) => setEnglishInput(e.target.value)}
                placeholder="Enter English text to refine..."
                className="w-full h-32 p-4 text-lg bg-gray-700 text-gray-100 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
              />

              <button
                onClick={handleRefineGrammar}
                disabled={isLoading}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  "Refine Grammar"
                )}
              </button>

              {refinedOutput && (
                <div className="bg-gray-700 rounded-xl p-6 border-2 border-gray-600">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-purple-300">
                      Refined Text:
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="p-2 bg-gray-600 rounded-lg hover:bg-gray-500"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-5 h-5 text-gray-100" />
                      </button>
                      <button
                        onClick={shareOutput}
                        className="p-2 bg-gray-600 rounded-lg hover:bg-gray-500"
                        title="Share"
                      >
                        <Share className="w-5 h-5 text-gray-100" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-100">{refinedOutput}</p>
                  {copied && (
                    <p className="text-green-400 mt-2">Copied to clipboard!</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
