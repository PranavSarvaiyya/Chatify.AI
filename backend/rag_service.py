import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader, TextLoader, CSVLoader, WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_mistralai import ChatMistralAI
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

# Prevent USER_AGENT warning from WebBaseLoader
os.environ["USER_AGENT"] = "ChatWithData/1.0"

class RagService:
    def __init__(self, db_path: str = "./chroma_db", collection_name: str = "chat_with_data"):
        self.db_path = db_path
        self.collection_name = collection_name
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        self.vectorstore = Chroma(
            embedding_function=self.embeddings,
            persist_directory=self.db_path,
            collection_name=self.collection_name
        )
        self.text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        self.retriever = self.vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={
                "k": 4,
                "fetch_k": 10,
                "lambda_mult": 0.5
            }
        )
        self.llm = ChatMistralAI(
            model_name="mistral-small-latest",
            temperature=0.7,
            max_tokens=1000,
            top_p=0.9
        )
        self.prompt_template = ChatPromptTemplate.from_messages(
            [
                (
                    "system", """
                    You are an expert AI assistant that answers user questions using the provided context.
                    Only use information from the context to answer the question.
                    If the answer is not in the context, say so clearly.

                    CRITICAL FORMATTING RULES:
                    1. Keep your answers concise, clear, and easy to read.
                    2. Limit your answer to a maximum of 3-4 bullet points or under 200 words.
                    3. Do not include unnecessary fluff.
                    """
                ),
                (
                    "user", """
                    Context: {context}
                    Question: {question}"""
                )
            ]
        )

    def get_supported_formats(self):
        return {"pdf": PyPDFLoader, "txt": TextLoader, "csv": CSVLoader, "url": WebBaseLoader}

    def load_document(self, file_path: str, file_type: str):
        try:
            if file_type == "url":
                loader = WebBaseLoader(web_path=file_path)
            else:
                loader = self.get_supported_formats()[file_type](file_path)
            return loader.load()
        except KeyError:
            raise ValueError(f"Unsupported file type: {file_type}. Supported types are: {list(self.get_supported_formats().keys())}")
    
    def add_document(self, file_path: str, file_type: str):
        try:
            document = self.load_document(file_path, file_type)
            chunks = self.text_splitter.split_documents(document)
            self.vectorstore.add_documents(chunks)
            print(f"Document added successfully: {file_path}")
        except ValueError as e:
            print(f"Error adding document: {e}")
        except Exception as e:
            print(f"Error adding document: {e}")

    def query(self, query: str):
        docs = self.retriever.invoke(query)
        context = "\n\n".join([d.page_content for d in docs])
        final_prompt = self.prompt_template.invoke({
            "context": context,
            "question": query
        })
        response = self.llm.invoke(final_prompt)
        return {"Answer": response.content}



