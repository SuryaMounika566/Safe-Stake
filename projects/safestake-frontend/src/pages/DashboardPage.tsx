import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Activity, Users, DollarSign, Target, TrendingUp, ShieldCheck, Heart } from "lucide-react";
import Card from "../components/common/Card";
import { getProposalsLength, getProposal } from "../data/getters";
import { ReadableProposal } from "../types";

const DashboardPage: React.FC = () => {
  const [proposals, setProposals] = useState<ReadableProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tvl: 0,
    totalVolume: 0,
    successRate: 0,
    activeProjects: 0,
    totalDonors: 0
  });

  useEffect(() => {
    const fetchAllProposals = async () => {
      setLoading(true);
      try {
        const length = await getProposalsLength();
        const allProposals: ReadableProposal[] = [];
        let volume = 0;
        let tvl = 0;
        let fullyFunded = 0;
        let donors = 0;

        for (let i = 0; i < Number(length); i++) {
          const prop = await getProposal(BigInt(i));
          if (prop) {
            allProposals.push(prop);
            volume += prop.amountRaised;
            
            // Calculate what is still locked (Raised - Claimed)
            const claimedAmounts = prop.milestones
              .filter(m => m.claimed)
              .reduce((sum, m) => sum + m.amount, 0);
            tvl += (prop.amountRaised - claimedAmounts);
            
            donors += prop.noOfUniqueDonors;
            
            if (prop.amountRaised >= prop.amountRequired) fullyFunded++;
          }
        }

        setProposals(allProposals.reverse()); // Show newest first
        setStats({
          tvl,
          totalVolume: volume,
          successRate: allProposals.length > 0 ? (fullyFunded / allProposals.length) * 100 : 0,
          activeProjects: allProposals.length,
          totalDonors: donors
        });
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllProposals();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <ShieldCheck className="mr-3 text-blue-600" size={32} />
          Transparency Dashboard
        </h1>
        <p className="text-lg text-gray-600">Real-time on-chain analytics and fund tracking.</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card padding="lg" className="bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-center text-blue-600 mb-2">
            <DollarSign size={20} className="mr-2" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Total Value Locked</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.tvl.toLocaleString()} ALGO</div>
          <p className="text-sm text-gray-500 mt-1">Funds secured in escrow</p>
        </Card>

        <Card padding="lg" className="bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center text-green-600 mb-2">
            <TrendingUp size={20} className="mr-2" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">All-Time Volume</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalVolume.toLocaleString()} ALGO</div>
          <p className="text-sm text-gray-500 mt-1">Total platform donations</p>
        </Card>

        <Card padding="lg" className="bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center text-purple-600 mb-2">
            <Target size={20} className="mr-2" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Project Success Rate</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.successRate.toFixed(1)}%</div>
          <p className="text-sm text-gray-500 mt-1">Projects fully funded</p>
        </Card>

        <Card padding="lg" className="bg-gradient-to-br from-orange-50 to-white">
          <div className="flex items-center text-orange-600 mb-2">
            <Users size={20} className="mr-2" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Total Donors</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalDonors}</div>
          <p className="text-sm text-gray-500 mt-1">Unique active contributors</p>
        </Card>
      </div>

      {/* Visualizations & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card padding="lg">
            <div className="flex items-center mb-6">
              <Activity className="text-gray-400 mr-2" size={20} />
              <h2 className="text-xl font-semibold break-all">Active Campaigns Directory</h2>
            </div>
            
            <div className="space-y-4">
              {proposals.length === 0 ? (
                <p className="text-gray-500 italic">No campaigns found on-chain yet.</p>
              ) : (
                proposals.map((prop, idx) => {
                  const percent = Math.min((prop.amountRaised / prop.amountRequired) * 100, 100);
                  const isActive = prop.amountRaised < prop.amountRequired;
                  
                  return (
                    <Link to={`/fundraiser/${prop.id}`} key={idx} className="block group">
                      <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-700">{prop.title}</h3>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isActive ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {isActive ? 'Funding' : 'In Execution'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className={`h-2 rounded-full ${percent >= 100 ? "bg-green-500" : "bg-blue-500"}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{prop.amountRaised} ALGO raised</span>
                          <span>By: {prop.createdBy.slice(0,8)}...{prop.createdBy.slice(-4)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card padding="lg">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              Trust & Safety Protocol
            </h2>
            <div className="space-y-6 text-sm text-gray-600">
              <div className="flex gap-4">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg h-10 w-10 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">AI-Verified Milestones</h4>
                  <p className="mt-1">Proofs submitted by creators are autonomously scanned by our AI auditor for authenticity before voting begins.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-purple-100 text-purple-600 p-2 rounded-lg h-10 w-10 flex items-center justify-center shrink-0">
                  <Heart size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Immutable Reputation</h4>
                  <p className="mt-1">Creator trust scores are calculated entirely on-chain based on historical success rates and claims.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-green-100 text-green-600 p-2 rounded-lg h-10 w-10 flex items-center justify-center shrink-0">
                  <Target size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">100% Escrow Backed</h4>
                  <p className="mt-1">The {stats.tvl.toLocaleString()} ALGO TVL is fully locked in decentralized smart contracts. Creators only access funds upon milestone approvals.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
