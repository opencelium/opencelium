package com.becon.opencelium.backend.execution.log_managing.commons;

import com.becon.opencelium.backend.utility.IndexPathUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class ElementsLinkedList<E> {
    private Node<E> head;
    private Node<E> tail;

    public ElementsLinkedList(String indexPath, E data) {
        head = new Node<>(null, null, indexPath, data);
        tail = head;
    }

    public void addLast(String indexPath, E data) {
        if (Objects.isNull(head)) {
            head = new Node<>(null, null, indexPath, data);
            tail = head;
            return;
        }

        if (IndexPathUtils.compare(tail.indexPath, indexPath) >= 0) {
            List<String> paths = walkAndCollectIndexPath(head);
            paths.add(indexPath);
            throw LogProcessingException.wrongIndexPathSequenceFound(paths);
        }

        Node<E> newNode = new Node<>(null, null, indexPath, data);
        tail.next = newNode;
        newNode.prev = tail;
        tail = newNode;
    }

    public void dropLast() {
        Node<E> prev = tail.prev;
        if (Objects.isNull(prev)) {
            head = null;
            tail = null;
            return;
        }
        prev.next = null;
        tail = prev;
    }

    public String getLastIndexPath() {
        return tail == null ? null : tail.indexPath;
    }

    private List<String> walkAndCollectIndexPath(Node<E> head) {
        if (Objects.isNull(head)) {
            return Collections.emptyList();
        }

        List<String> paths = new ArrayList<>();
        Node<E> dummy = head;
        while (dummy != null) {
            paths.add(dummy.indexPath);
            dummy = dummy.next;
        }
        return paths;
    }

    public E getLastData() {
        return tail == null ? null : tail.data;
    }

    private static class Node<E> {
        private Node<E> next;
        private Node<E> prev;
        private final String indexPath;
        private final E data;

        public Node(Node<E> next, Node<E> prev, String indexPath, E data) {
            this.next = next;
            this.prev = prev;
            this.indexPath = indexPath;
            this.data = data;
        }
    }
}