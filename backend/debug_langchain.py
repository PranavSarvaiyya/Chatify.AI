try:
    import langchain
    print(f"langchain location: {langchain.__file__}")
    print(f"langchain version: {langchain.__version__}")
    from langchain.chains import RetrievalQA
    print("RetrievalQA successfully imported")
except ImportError as e:
    print(f"ImportError: {e}")
except Exception as e:
    print(f"Error: {e}")
