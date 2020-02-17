***************
Authentication
***************

For authentication of user, API responses JWT token that stores in the ``HTTP header``.
Type of JWT Token is Bearer

Log In
======

.. parsed-literal::
    # Auhtenticate user
    ```POST``` http://localhost:8080/``login`` HTTP/1.1

Request
-------

.. code-block:: text
    :caption: ``Header:``

    Content-Type : application/json


.. code-block:: json
    :caption: ``Body:``
   
    {
      "email" : "test@email.com",
      "password" : "user-password",
    }
   


Response
--------

**Success:**

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}


.. code-block:: json
    :caption: ``Body:``
    
    {
       "status" : 200,
       "success" : "true",
    }


**Error:**

.. code-block:: json
    :caption: ``Body:``
    
    {
       "timestamp" : "2018-05-24T12:44:26.295+0000",
       "status" : 403,
       "error" : {
           "message" : "Forbidden"
       },
       "success" : "false",
       "path" : "/login"
    }

----------------------------------------------------------------

Log Out
=======

.. parsed-literal::
    # Auhtenticate user
    ```GET``` http://localhost:8080/{userId}/``logout`` HTTP/1.1

Request
-------

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : application/json

Response
--------

**Success:**

.. code-block:: text
    :caption: ``Body:``
       
    {
        "status": 204,
        "success": "true",
    }

**Error:**

.. code-block:: js
    :caption: ``Body:``
       
    {
        "timestamp" : "2018-05-24T12:44:26.295+0000",
        "status" : 500,
        "error" : {
            "message" : "Internal error"
        },
        "success" : "false",
        "path" : "/api/user/all"
    }

