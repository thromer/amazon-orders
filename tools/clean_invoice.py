import sys

from bs4 import BeautifulSoup, Comment

def main():
    with open(sys.argv[1]) as f:
        soup = BeautifulSoup(f, "html5lib")
        for script in soup.find_all('script'):
            script.decompose()
        for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
            _ = comment.extract()        
        print(soup.prettify())

if __name__ == "__main__":
    main()
