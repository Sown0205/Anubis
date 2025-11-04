import logging
from typing import List, Dict, Any
from models.network_models import NetworkFlow, AIModelOutput
import asyncio
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path
import json
import joblib
import random

logger = logging.getLogger(__name__)

class AIModelService:
    """
    AI Model Service for network traffic classification using trained ANUBIS model
    """
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.selected_features = None
        self.is_loaded = False
        self.model_name = "ANUBIS-NetworkSecurityModel-v0"
        self.model_dir = Path("../backend/models/trained_models")
        
    async def load_model(self, model_path: str = None):
        """
        Load the trained ANUBIS AI model and scaler
        """
        try:
            logger.info(f"Loading AI model: {self.model_name}")
            
            # Load the trained model
            model_file = self.model_dir / "ANUBIS_AI_Model_v0.pkl"
            scaler_file = self.model_dir / "ANUBIS_AI_Scaler.pkl"
            features_file = self.model_dir / "selected_features.json"
            
            if not model_file.exists():
                raise FileNotFoundError(f"Model file not found: {model_file}")
            if not scaler_file.exists():
                raise FileNotFoundError(f"Scaler file not found: {scaler_file}")
            if not features_file.exists():
                raise FileNotFoundError(f"Features file not found: {features_file}")
            
            # Load model components
            self.model = joblib.load(model_file)
            self.scaler = joblib.load(scaler_file)
            
            # Load selected features
            with open(features_file, 'r') as f:
                self.selected_features = json.load(f)
            
            self.is_loaded = True
            
            logger.info(f"AI model loaded successfully with {len(self.selected_features)} features")
            logger.info(f"Model type: {type(self.model).__name__}")
            logger.info(f"Scaler type: {type(self.scaler).__name__}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to load AI model: {str(e)}")
            self.is_loaded = False
            return False
    
    def preprocess_flow_data(self, flow_features: Dict[str, Any]) -> np.ndarray:
        """
        Preprocess flow features for the trained ANUBIS model
        Maps cicflowmeter features to the exact features used in training
        """
        if not self.selected_features:
            raise Exception("Selected features not loaded")
        
        # Create feature mapping from cicflowmeter output to model features
        feature_mapping = {
            "Destination Port": flow_features.get("Dst Port", 0),
            "Flow Duration": flow_features.get("Flow Duration", 0),
            "Fwd Packet Length Min": flow_features.get("Fwd Pkt Len Min", 0),
            "Bwd Packet Length Max": flow_features.get("Bwd Pkt Len Max", 0),
            "Bwd Packet Length Min": flow_features.get("Bwd Pkt Len Min", 0),
            "Bwd Packet Length Mean": flow_features.get("Bwd Pkt Len Mean", 0),
            "Bwd Packet Length Std": flow_features.get("Bwd Pkt Len Std", 0),
            "Flow IAT Mean": flow_features.get("Flow IAT Mean", 0),
            "Flow IAT Std": flow_features.get("Flow IAT Std", 0),
            "Flow IAT Max": flow_features.get("Flow IAT Max", 0),
            "Fwd IAT Total": flow_features.get("Fwd IAT Tot", 0),
            "Fwd IAT Mean": flow_features.get("Fwd IAT Mean", 0),
            "Fwd IAT Std": flow_features.get("Fwd IAT Std", 0),
            "Fwd IAT Max": flow_features.get("Fwd IAT Max", 0),
            "Bwd IAT Std": flow_features.get("Bwd IAT Std", 0),
            "Bwd IAT Max": flow_features.get("Bwd IAT Max", 0),
            "Min Packet Length": flow_features.get("Min Pkt Len", 0),
            "Max Packet Length": flow_features.get("Max Pkt Len", 0),
            "Packet Length Mean": flow_features.get("Pkt Len Mean", 0),
            "Packet Length Std": flow_features.get("Pkt Len Std", 0),
            "Packet Length Variance": flow_features.get("Pkt Len Var", 0),
            "FIN Flag Count": flow_features.get("FIN Flag Cnt", 0),
            "PSH Flag Count": flow_features.get("PSH Flag Cnt", 0),
            "ACK Flag Count": flow_features.get("ACK Flag Cnt", 0),
            "URG Flag Count": flow_features.get("URG Flag Cnt", 0),
            "Average Packet Size": flow_features.get("Pkt Size Avg", 0),
            "Avg Bwd Segment Size": flow_features.get("Bwd Seg Size Avg", 0),
            "Idle Mean": flow_features.get("Idle Mean", 0),
            "Idle Max": flow_features.get("Idle Max", 0),
            "Idle Min": flow_features.get("Idle Min", 0)
        }
        
        # Extract features in the correct order
        feature_vector = []
        for feature_name in self.selected_features:
            value = feature_mapping.get(feature_name, 0)
            # Handle NaN and infinite values
            if pd.isna(value) or np.isinf(value):
                value = 0
            feature_vector.append(float(value))
        
        return np.array(feature_vector).reshape(1, -1)

    def preprocess_networkflow_data(self, flow: NetworkFlow) -> Dict[str, Any]:
        """
        Convert NetworkFlow object to cicflowmeter-like features for compatibility
        This is used when we have individual NetworkFlow objects (real-time scanning)
        """
        features = {
            'Dst Port': flow.dst_port,
            'Flow Duration': (flow.flow_duration or 0.0) * 1_000_000,  # Convert to microseconds
            'Fwd Pkt Len Min': 64,  # Default values for missing features
            'Bwd Pkt Len Max': 0,
            'Bwd Pkt Len Min': 0, 
            'Bwd Pkt Len Mean': 0,
            'Bwd Pkt Len Std': 0,
            'Flow IAT Mean': 0,
            'Flow IAT Std': 0,
            'Flow IAT Max': 0,
            'Fwd IAT Tot': 0,
            'Fwd IAT Mean': 0,
            'Fwd IAT Std': 0,
            'Fwd IAT Max': 0,
            'Bwd IAT Std': 0,
            'Bwd IAT Max': 0,
            'Min Pkt Len': 64,
            'Max Pkt Len': flow.total_bytes or 1500,
            'Pkt Len Mean': (flow.total_bytes or 64) / max(1, flow.packet_count or 1),
            'Pkt Len Std': 0,
            'Pkt Len Var': 0,
            'FIN Flag Cnt': 0,
            'PSH Flag Cnt': 0,
            'ACK Flag Cnt': 1 if flow.protocol == 'TCP' else 0,
            'URG Flag Cnt': 0,
            'Pkt Size Avg': (flow.total_bytes or 64) / max(1, flow.packet_count or 1),
            'Bwd Seg Size Avg': 0,
            'Idle Mean': 0,
            'Idle Max': 0,
            'Idle Min': 0
        }
        
        return features
    
    async def predict_single_flow(self, flow: NetworkFlow) -> AIModelOutput:
        """
        Predict classification for a single network flow using the trained model
        """
        if not self.is_loaded:
            raise Exception("AI model not loaded")
            
        try:
            # Convert NetworkFlow to cicflowmeter-like features
            flow_features = self.preprocess_networkflow_data(flow)
            
            # Preprocess for model
            feature_vector = self.preprocess_flow_data(flow_features)
            
            # Scale features using trained scaler
            scaled_features = self.scaler.transform(feature_vector)
            
            # Get prediction
            prediction = self.model.predict(scaled_features)[0]
            probabilities = self.model.predict_proba(scaled_features)[0]
            
            # Get confidence (probability of predicted class)
            if prediction == 1:  # Attack
                confidence = probabilities[1]
                classification = "ATTACK"
                risk_score = confidence
                # Determine threat type based on confidence and features
                threat_type = self._determine_threat_type(flow_features, confidence)
            else:  # Benign
                confidence = probabilities[0]
                classification = "BENIGN"
                risk_score = 1 - confidence
                threat_type = None
            
            return AIModelOutput(
                classification=classification,
                confidence=float(confidence),
                threat_type=threat_type,
                risk_score=float(risk_score)
            )
            
        except Exception as e:
            logger.error(f"AI model prediction failed: {str(e)}")
            # Return safe default
            return AIModelOutput(
                classification="BENIGN",
                confidence=0.5,
                threat_type=None,
                risk_score=0.5
            )

    async def predict_flow_features(self, flow_features: Dict[str, Any]) -> AIModelOutput:
        """
        Predict classification for flow features directly (used in PCAP analysis)
        """
        if not self.is_loaded:
            raise Exception("AI model not loaded")
            
        try:
            # Preprocess features for model
            feature_vector = self.preprocess_flow_data(flow_features)
            
            # Scale features using trained scaler
            scaled_features = self.scaler.transform(feature_vector)
            
            # Get prediction
            prediction = self.model.predict(scaled_features)[0]
            probabilities = self.model.predict_proba(scaled_features)[0]
            
            # Get confidence and classification
            if prediction == 1:  # Attack
                confidence = probabilities[1]
                classification = "ATTACK"
                risk_score = confidence
                threat_type = self._determine_threat_type(flow_features, confidence)
            else:  # Benign
                confidence = probabilities[0]
                classification = "BENIGN"
                risk_score = 1 - confidence
                threat_type = None
            
            return AIModelOutput(
                classification=classification,
                confidence=float(confidence),
                threat_type=threat_type,
                risk_score=float(risk_score)
            )
            
        except Exception as e:
            logger.error(f"AI model prediction failed: {str(e)}")
            return AIModelOutput(
                classification="BENIGN",
                confidence=0.5,
                threat_type=None,
                risk_score=0.5
            )

    def _determine_threat_type(self, flow_features: Dict[str, Any], confidence: float) -> str:
        """
        Determine threat type based on flow characteristics and confidence
        """
        dst_port = flow_features.get("Dst Port", 0)
        packet_rate = flow_features.get("Flow Pkts/s", 0)
        
        # Simple heuristic-based threat classification
        if dst_port in [22, 23]:  # SSH, Telnet
            return "Brute_Force"
        elif dst_port in [80, 443, 8080]:  # HTTP/HTTPS
            if packet_rate > 100:
                return "DDoS"
            else:
                return "Web_Attack"
        elif dst_port in [135, 139, 445]:  # SMB, NetBIOS
            return "Lateral_Movement"
        elif confidence > 0.9:
            return "High_Confidence_Attack"
        else:
            return "Suspicious_Activity"
    
    async def predict_batch_flows(self, flows: List[NetworkFlow]) -> List[AIModelOutput]:
        """
        Predict classifications for multiple network flows efficiently
        """
        if not self.is_loaded:
            raise Exception("AI model not loaded")
            
        try:
            # Convert all flows to feature vectors
            feature_vectors = []
            for flow in flows:
                flow_features = self.preprocess_networkflow_data(flow)
                feature_vector = self.preprocess_flow_data(flow_features)
                feature_vectors.append(feature_vector[0])  # Remove reshape dimension
            
            if not feature_vectors:
                return []
            
            # Stack into batch
            batch_features = np.vstack(feature_vectors)
            
            # Scale features
            scaled_features = self.scaler.transform(batch_features)
            
            # Get batch predictions
            predictions = self.model.predict(scaled_features)
            probabilities = self.model.predict_proba(scaled_features)
            
            # Convert to AIModelOutput objects
            results = []
            for i, (pred, probs) in enumerate(zip(predictions, probabilities)):
                flow_features = self.preprocess_networkflow_data(flows[i])
                
                if pred == 1:  # Attack
                    confidence = probs[1]
                    classification = "ATTACK"
                    risk_score = confidence
                    threat_type = self._determine_threat_type(flow_features, confidence)
                else:  # Benign
                    confidence = probs[0]
                    classification = "BENIGN"
                    risk_score = 1 - confidence
                    threat_type = None
                
                results.append(AIModelOutput(
                    classification=classification,
                    confidence=float(confidence),
                    threat_type=threat_type,
                    risk_score=float(risk_score)
                ))
            
            return results
            
        except Exception as e:
            logger.error(f"Batch prediction failed: {str(e)}")
            return [
                AIModelOutput(
                    classification="BENIGN",
                    confidence=0.5,
                    threat_type=None,
                    risk_score=0.5
                ) for _ in flows
            ]

    async def predict_batch_features(self, features_list: List[Dict[str, Any]]) -> List[AIModelOutput]:
        """
        Predict classifications for multiple flow features efficiently (for PCAP analysis)
        """
        if not self.is_loaded:
            raise Exception("AI model not loaded")
            
        try:
            if not features_list:
                return []
            
            # Convert all feature dicts to vectors
            feature_vectors = []
            for flow_features in features_list:
                feature_vector = self.preprocess_flow_data(flow_features)
                feature_vectors.append(feature_vector[0])
            
            # Stack into batch
            batch_features = np.vstack(feature_vectors)
            
            # Scale features
            scaled_features = self.scaler.transform(batch_features)
            
            # Get batch predictions
            predictions = self.model.predict(scaled_features)
            probabilities = self.model.predict_proba(scaled_features)
            
            # Convert to AIModelOutput objects
            results = []
            for i, (pred, probs) in enumerate(zip(predictions, probabilities)):
                if pred == 1:  # Attack
                    confidence = probs[1]
                    classification = "ATTACK"
                    risk_score = confidence
                    threat_type = self._determine_threat_type(features_list[i], confidence)
                else:  # Benign
                    confidence = probs[0]
                    classification = "BENIGN"
                    risk_score = 1 - confidence
                    threat_type = None
                
                results.append(AIModelOutput(
                    classification=classification,
                    confidence=float(confidence),
                    threat_type=threat_type,
                    risk_score=float(risk_score)
                ))
            
            return results
            
        except Exception as e:
            logger.error(f"Batch features prediction failed: {str(e)}")
            return [
                AIModelOutput(
                    classification="BENIGN",
                    confidence=0.5,
                    threat_type=None,
                    risk_score=0.5
                ) for _ in features_list
            ]
    
    # def _mock_prediction(self, features: Dict[str, Any]) -> bool:
    #     """
    #     Mock prediction logic - REMOVE THIS when integrating real model
    #     This simulates attack detection based on some heuristics
    #     """
    #     # Simple heuristic: certain ports are more likely to be attacks
    #     suspicious_ports = [22, 23, 135, 139, 445, 1433, 3389, 4444, 5432]
        
    #     # Higher chance of attack for suspicious ports
    #     if features.get('dst_port') in suspicious_ports:
    #         return random.random() < 0.3  # 30% chance of being classified as attack
        
    #     # Lower chance for common ports
    #     common_ports = [80, 443, 53, 25, 110, 993, 995]
    #     if features.get('dst_port') in common_ports:
    #         return random.random() < 0.05  # 5% chance of being classified as attack
            
    #     # Default chance for other ports
    #     return random.random() < 0.15  # 15% chance of being classified as attack
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the loaded model
        """
        return {
            "model_name": self.model_name,
            "is_loaded": self.is_loaded,
            "status": "Active" if self.is_loaded else "Inactive",
            "last_updated": datetime.utcnow().isoformat()
        }

# Global AI model service instance
ai_model_service = AIModelService()